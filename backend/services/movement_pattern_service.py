from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List, Optional
from .animal_behavior_service import AnimalBehaviorService
from .weather_service import WeatherService
from .gmu_service import GMUService

class MovementPatternService:
    def __init__(self):
        self.behavior_service = AnimalBehaviorService()
        self.weather_service = WeatherService()
        self.gmu_service = GMUService()
        
        # Define terrain preferences by condition
        self.terrain_preferences = {
            'elk': {
                'feeding': {
                    'meadow': 0.8,
                    'forest_edge': 0.7,
                    'forest': 0.4,
                    'alpine': 0.3
                },
                'bedding': {
                    'forest': 0.9,
                    'forest_edge': 0.6,
                    'meadow': 0.2,
                    'alpine': 0.3
                },
                'traveling': {
                    'forest_edge': 0.7,
                    'meadow': 0.6,
                    'forest': 0.5,
                    'alpine': 0.4
                }
            },
            'deer': {
                'feeding': {
                    'forest_edge': 0.8,
                    'meadow': 0.7,
                    'forest': 0.5,
                    'alpine': 0.2
                },
                'bedding': {
                    'forest': 0.9,
                    'forest_edge': 0.7,
                    'meadow': 0.2,
                    'alpine': 0.1
                },
                'traveling': {
                    'forest_edge': 0.8,
                    'forest': 0.6,
                    'meadow': 0.5,
                    'alpine': 0.3
                }
            },
            'moose': {
                'feeding': {
                    'riparian': 0.9,
                    'forest_edge': 0.7,
                    'forest': 0.6,
                    'meadow': 0.4
                },
                'bedding': {
                    'forest': 0.8,
                    'riparian': 0.7,
                    'forest_edge': 0.6,
                    'meadow': 0.3
                },
                'traveling': {
                    'forest': 0.7,
                    'riparian': 0.7,
                    'forest_edge': 0.6,
                    'meadow': 0.4
                }
            }
        }
        
    def predict_movement_patterns(self, 
                                animal_type: str,
                                gmu_id: str,
                                date: datetime,
                                weather_conditions: Optional[Dict] = None) -> Dict:
        """Predict animal movement patterns for a specific time and location"""
        
        # Get GMU terrain data
        gmu_bounds = self.gmu_service.get_gmu_bounds(gmu_id)
        if not gmu_bounds:
            return {"error": "GMU not found"}
            
        # Get weather if not provided
        if not weather_conditions:
            center_lat = (gmu_bounds['north'] + gmu_bounds['south']) / 2
            center_lon = (gmu_bounds['east'] + gmu_bounds['west']) / 2
            weather_conditions = self.weather_service.get_current_weather(
                center_lat, center_lon
            )
            
        # Get behavior factors
        behavior_factors = self.behavior_service.get_behavior_factors(
            animal_type, date, (gmu_bounds['elevation_min'] + gmu_bounds['elevation_max']) / 2
        )
        
        # Determine primary activity based on time and conditions
        activity_type = self._determine_primary_activity(
            date, behavior_factors, weather_conditions
        )
        
        # Get terrain preferences for current activity
        terrain_prefs = self.terrain_preferences[animal_type][activity_type]
        
        # Adjust preferences based on conditions
        adjusted_prefs = self._adjust_terrain_preferences(
            terrain_prefs,
            weather_conditions,
            behavior_factors
        )
        
        # Calculate movement vectors
        movement_vectors = self._calculate_movement_vectors(
            activity_type,
            adjusted_prefs,
            weather_conditions
        )
        
        return {
            "current_time": date.strftime("%Y-%m-%d %H:%M"),
            "animal_type": animal_type,
            "primary_activity": activity_type,
            "behavior_factors": behavior_factors,
            "terrain_preferences": adjusted_prefs,
            "movement_vectors": movement_vectors,
            "confidence_score": self._calculate_confidence_score(
                behavior_factors,
                weather_conditions
            )
        }
        
    def predict_daily_pattern(self,
                            animal_type: str,
                            gmu_id: str,
                            date: datetime) -> List[Dict]:
        """Predict movement patterns throughout the day"""
        predictions = []
        
        # Get weather forecast
        gmu_bounds = self.gmu_service.get_gmu_bounds(gmu_id)
        center_lat = (gmu_bounds['north'] + gmu_bounds['south']) / 2
        center_lon = (gmu_bounds['east'] + gmu_bounds['west']) / 2
        weather_forecast = self.weather_service.get_forecast(center_lat, center_lon)
        
        # Predict patterns for each hour
        for hour in range(24):
            time = date.replace(hour=hour)
            weather = self._interpolate_weather(weather_forecast, time)
            
            prediction = self.predict_movement_patterns(
                animal_type, gmu_id, time, weather
            )
            predictions.append(prediction)
            
        return predictions
        
    def _determine_primary_activity(self,
                                  time: datetime,
                                  behavior_factors: Dict,
                                  weather: Dict) -> str:
        """Determine the primary activity based on time and conditions"""
        hour = time.hour
        
        # Early morning/evening: Likely feeding
        if (5 <= hour <= 9) or (17 <= hour <= 21):
            return 'feeding'
            
        # Middle of day: Likely bedding
        if 10 <= hour <= 16:
            # Unless it's breeding season and weather is good
            if (behavior_factors['breeding_factor'] > 0.7 and
                weather['temperature'] < 70 and
                weather['wind_speed'] < 15):
                return 'traveling'
            return 'bedding'
            
        # Night: Mix of feeding and bedding
        return 'feeding' if hour in [22, 23, 0, 1] else 'bedding'
        
    def _adjust_terrain_preferences(self,
                                  base_prefs: Dict[str, float],
                                  weather: Dict,
                                  behavior: Dict) -> Dict[str, float]:
        """Adjust terrain preferences based on conditions"""
        adjusted = base_prefs.copy()
        
        # Weather adjustments
        if weather['temperature'] > 80:
            # Prefer cooler, covered areas
            adjusted['forest'] *= 1.2
            adjusted['meadow'] *= 0.8
            
        if weather['wind_speed'] > 15:
            # Prefer sheltered areas
            adjusted['forest'] *= 1.3
            adjusted['forest_edge'] *= 1.1
            adjusted['meadow'] *= 0.7
            
        if weather.get('precipitation_type') == 'rain':
            # Prefer covered areas
            adjusted['forest'] *= 1.2
            adjusted['meadow'] *= 0.8
            
        # Behavior adjustments
        if behavior['breeding_factor'] > 0.5:
            # Prefer more open areas during breeding
            adjusted['meadow'] *= 1.2
            adjusted['forest_edge'] *= 1.1
            
        if behavior['migration_factor'] > 0.5:
            # Prefer travel corridors during migration
            adjusted['forest_edge'] *= 1.2
            adjusted['meadow'] *= 1.1
            
        # Normalize preferences
        total = sum(adjusted.values())
        return {k: v/total for k, v in adjusted.items()}
        
    def _calculate_movement_vectors(self,
                                  activity: str,
                                  terrain_prefs: Dict[str, float],
                                  weather: Dict) -> Dict:
        """Calculate likely movement vectors"""
        # Base movement ranges by activity (in meters)
        movement_ranges = {
            'feeding': {'min': 100, 'max': 500},
            'bedding': {'min': 0, 'max': 50},
            'traveling': {'min': 500, 'max': 2000}
        }
        
        # Adjust for weather
        range_modifier = 1.0
        if weather['temperature'] > 80:
            range_modifier *= 0.7
        if weather['wind_speed'] > 15:
            range_modifier *= 0.8
        if weather.get('precipitation_type') in ['rain', 'snow']:
            range_modifier *= 0.6
            
        movement_range = movement_ranges[activity]
        adjusted_range = {
            'min': movement_range['min'] * range_modifier,
            'max': movement_range['max'] * range_modifier
        }
        
        # Calculate primary movement direction (relative to wind)
        wind_dir = weather.get('wind_direction', 'N')
        movement_dir = self._calculate_movement_direction(wind_dir, activity)
        
        return {
            'range': adjusted_range,
            'direction': movement_dir,
            'terrain_preference_order': sorted(
                terrain_prefs.items(),
                key=lambda x: x[1],
                reverse=True
            )
        }
        
    def _calculate_movement_direction(self,
                                   wind_dir: str,
                                   activity: str) -> str:
        """Calculate likely movement direction relative to wind"""
        # Convert cardinal direction to degrees
        dir_to_deg = {
            'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
            'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
            'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
            'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
        }
        
        wind_deg = dir_to_deg.get(wind_dir, 0)
        
        if activity == 'feeding':
            # Generally crosswind
            movement_deg = (wind_deg + 90) % 360
        elif activity == 'traveling':
            # Generally downwind
            movement_deg = (wind_deg + 180) % 360
        else:  # bedding
            # Generally upwind but sheltered
            movement_deg = wind_deg
            
        # Convert back to cardinal direction
        deg_to_dir = {v: k for k, v in dir_to_deg.items()}
        closest_dir = min(deg_to_dir.keys(),
                         key=lambda x: abs(x - movement_deg))
        return deg_to_dir[closest_dir]
        
    def _calculate_confidence_score(self,
                                  behavior: Dict[str, float],
                                  weather: Dict) -> float:
        """Calculate confidence score for predictions"""
        # Base confidence from behavior factors
        behavior_confidence = np.mean([
            behavior['breeding_factor'],
            behavior['activity_factor'],
            1 - behavior['migration_factor']  # More confident when not migrating
        ])
        
        # Weather confidence
        weather_confidence = 1.0
        if weather['wind_speed'] > 20:
            weather_confidence *= 0.8
        if weather.get('precipitation_type') in ['rain', 'snow']:
            weather_confidence *= 0.9
            
        # Combine confidences
        return min(1.0, behavior_confidence * weather_confidence)
