import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import requests
from .gmu_service import GMUService
from .weather_service import WeatherService

class GMUAnalysisService:
    def __init__(self):
        self.gmu_service = GMUService()
        self.weather_service = WeatherService()
        
    def analyze_gmu(self, gmu_id: str) -> Dict:
        """Comprehensive GMU analysis including terrain, weather, and success predictions"""
        gmu_bounds = self.gmu_service.get_gmu_bounds(gmu_id)
        if not gmu_bounds:
            return {"error": "GMU not found"}
            
        # Get current weather and forecast
        center_lat = (gmu_bounds['north'] + gmu_bounds['south']) / 2
        center_lon = (gmu_bounds['east'] + gmu_bounds['west']) / 2
        weather_data = self.weather_service.get_forecast(center_lat, center_lon)
        
        return {
            "gmu_info": self._get_gmu_info(gmu_id),
            "success_prediction": self._calculate_success_prediction(gmu_id, weather_data),
            "hourly_activity": self._predict_hourly_activity(weather_data),
            "terrain_analysis": self._analyze_terrain(gmu_id),
            "weather_impact": self._analyze_weather_impact(weather_data)
        }
        
    def _get_gmu_info(self, gmu_id: str) -> Dict:
        """Get basic GMU information and historical statistics"""
        # This would be expanded to include more detailed historical data
        return {
            "id": gmu_id,
            "historical_success_rate": 0.35,  # Example data - would come from database
            "peak_seasons": ["October", "November"],
            "typical_harvest": 150  # Example data
        }
        
    def _calculate_success_prediction(self, gmu_id: str, weather_data: Dict) -> Dict:
        """Calculate hunting success prediction based on multiple factors"""
        # This would use machine learning model in production
        factors = {
            "weather_score": self._score_weather_conditions(weather_data),
            "seasonal_score": self._calculate_seasonal_score(),
            "pressure_score": 0.8,  # Example - would be calculated from historical pressure
            "moon_phase_score": 0.7  # Example - would be calculated from current moon phase
        }
        
        # Simple weighted average for now
        weights = {"weather_score": 0.3, "seasonal_score": 0.3, 
                  "pressure_score": 0.2, "moon_phase_score": 0.2}
        overall_score = sum(score * weights[factor] for factor, score in factors.items())
        
        return {
            "success_probability": overall_score,
            "contributing_factors": factors,
            "confidence_level": 0.75  # Would be calculated based on data quality
        }
        
    def _predict_hourly_activity(self, weather_data: Dict) -> List[Dict]:
        """Predict animal activity levels for each hour"""
        predictions = []
        base_time = datetime.now()
        
        for hour in range(24):
            time = base_time + timedelta(hours=hour)
            # This would use a more sophisticated model in production
            activity_level = self._calculate_activity_level(time, weather_data)
            predictions.append({
                "hour": time.strftime("%H:00"),
                "activity_level": activity_level,
                "confidence": 0.8,
                "factors": ["weather", "time of day", "moon phase"]
            })
            
        return predictions
        
    def _analyze_terrain(self, gmu_id: str) -> Dict:
        """Analyze terrain features and identify potential hotspots"""
        return {
            "elevation_range": {"min": 7000, "max": 12000},  # Example data
            "terrain_types": {
                "forest": 0.45,
                "meadow": 0.25,
                "rocky": 0.20,
                "water": 0.10
            },
            "hotspots": [
                {
                    "name": "North Ridge",
                    "lat": 40.5,
                    "lon": -106.8,
                    "rating": 0.85,
                    "features": ["ridge line", "water source", "bedding area"]
                }
                # Would include multiple hotspots
            ]
        }
        
    def _analyze_weather_impact(self, weather_data: Dict) -> Dict:
        """Analyze how weather conditions impact hunting success"""
        return {
            "overall_impact": "favorable",
            "wind_conditions": {
                "speed": weather_data.get("wind_speed", 0),
                "direction": weather_data.get("wind_direction", "N"),
                "impact": "moderate"
            },
            "precipitation": {
                "type": weather_data.get("precipitation_type", "none"),
                "impact": "positive" if weather_data.get("precipitation_type") == "snow" else "neutral"
            },
            "temperature": {
                "current": weather_data.get("temperature", 0),
                "impact": "favorable" if 30 <= weather_data.get("temperature", 0) <= 60 else "unfavorable"
            }
        }
        
    def _score_weather_conditions(self, weather_data: Dict) -> float:
        """Score weather conditions for hunting success"""
        # Simple scoring example - would be more sophisticated in production
        temp = weather_data.get("temperature", 45)
        wind_speed = weather_data.get("wind_speed", 5)
        
        temp_score = 1.0 - abs(temp - 45) / 45  # Optimal temp around 45F
        wind_score = 1.0 - (wind_speed / 30)    # Lower wind is better
        
        return (temp_score + wind_score) / 2
        
    def _calculate_seasonal_score(self) -> float:
        """Calculate score based on time of year"""
        today = datetime.now()
        # Example: Peak season is October-November
        if today.month in [10, 11]:
            return 0.9
        elif today.month in [9, 12]:
            return 0.7
        return 0.5
        
    def _calculate_activity_level(self, time: datetime, weather_data: Dict) -> float:
        """Calculate animal activity level for a specific time"""
        hour = time.hour
        # Simple model: higher activity during dawn and dusk
        if 5 <= hour <= 8 or 17 <= hour <= 20:
            base_activity = 0.8
        elif 0 <= hour <= 4 or 21 <= hour <= 23:
            base_activity = 0.3
        else:
            base_activity = 0.5
            
        # Adjust for weather
        weather_factor = self._score_weather_conditions(weather_data)
        return base_activity * weather_factor
