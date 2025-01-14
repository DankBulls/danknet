from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List, Optional
from .weather_service import WeatherService
from .gmu_service import GMUService

class EnvironmentalAnalysisService:
    def __init__(self):
        self.weather_service = WeatherService()
        self.gmu_service = GMUService()
        
        # Define optimal conditions for hunting
        self.optimal_conditions = {
            'temperature': {
                'ideal_range': (30, 60),  # Fahrenheit
                'acceptable_range': (20, 70)
            },
            'wind_speed': {
                'ideal_range': (3, 10),    # mph
                'acceptable_range': (0, 15)
            },
            'humidity': {
                'ideal_range': (40, 70),   # percentage
                'acceptable_range': (30, 80)
            },
            'pressure': {
                'ideal_range': (29.8, 30.2),  # inHg
                'acceptable_range': (29.5, 30.5)
            },
            'cloud_cover': {
                'ideal_range': (20, 70),   # percentage
                'acceptable_range': (0, 100)
            }
        }
        
    def analyze_environment(self, gmu_id: str, date: datetime) -> Dict:
        """Perform comprehensive environmental analysis"""
        # Get GMU data
        gmu_bounds = self.gmu_service.get_gmu_bounds(gmu_id)
        if not gmu_bounds:
            return {"error": "GMU not found"}
            
        # Get weather data
        center_lat = (gmu_bounds['north'] + gmu_bounds['south']) / 2
        center_lon = (gmu_bounds['east'] + gmu_bounds['west']) / 2
        
        current_weather = self.weather_service.get_current_weather(
            center_lat, center_lon
        )
        forecast = self.weather_service.get_forecast(
            center_lat, center_lon
        )
        
        # Analyze conditions
        current_analysis = self._analyze_conditions(current_weather)
        forecast_analysis = [
            self._analyze_conditions(f) for f in forecast[:24]  # 24-hour forecast
        ]
        
        # Get hunting condition scores
        hunting_scores = self._calculate_hunting_scores(
            current_analysis,
            forecast_analysis
        )
        
        # Analyze pressure trends
        pressure_trend = self._analyze_pressure_trend(
            [f.get('pressure', 0) for f in forecast[:12]]  # 12-hour trend
        )
        
        return {
            "current_conditions": current_analysis,
            "forecast_analysis": forecast_analysis,
            "hunting_scores": hunting_scores,
            "pressure_trend": pressure_trend,
            "recommendations": self._generate_recommendations(
                current_analysis,
                hunting_scores,
                pressure_trend
            )
        }
        
    def get_optimal_times(self, gmu_id: str,
                         start_date: datetime,
                         days: int = 5) -> List[Dict]:
        """Find optimal hunting times based on environmental conditions"""
        gmu_bounds = self.gmu_service.get_gmu_bounds(gmu_id)
        center_lat = (gmu_bounds['north'] + gmu_bounds['south']) / 2
        center_lon = (gmu_bounds['east'] + gmu_bounds['west']) / 2
        
        optimal_times = []
        current_date = start_date
        
        for _ in range(days):
            day_forecast = self.weather_service.get_forecast(
                center_lat, center_lon, days=1
            )
            
            # Analyze each 3-hour period
            for period in day_forecast:
                analysis = self._analyze_conditions(period)
                score = self._calculate_period_score(analysis)
                
                if score > 0.7:  # Only include high-scoring periods
                    optimal_times.append({
                        "time": period['timestamp'],
                        "score": score,
                        "conditions": analysis,
                        "recommendations": self._generate_period_recommendations(
                            analysis
                        )
                    })
                    
            current_date += timedelta(days=1)
            
        return sorted(optimal_times, key=lambda x: x['score'], reverse=True)
        
    def _analyze_conditions(self, weather: Dict) -> Dict:
        """Analyze specific weather conditions"""
        analysis = {}
        
        for condition, ranges in self.optimal_conditions.items():
            value = weather.get(condition)
            if value is None:
                continue
                
            ideal_min, ideal_max = ranges['ideal_range']
            accept_min, accept_max = ranges['acceptable_range']
            
            if ideal_min <= value <= ideal_max:
                rating = "ideal"
                score = 1.0
            elif accept_min <= value <= accept_max:
                # Calculate score based on distance from ideal range
                if value < ideal_min:
                    score = 0.5 + 0.5 * (value - accept_min) / (ideal_min - accept_min)
                else:
                    score = 0.5 + 0.5 * (accept_max - value) / (accept_max - ideal_max)
                rating = "acceptable"
            else:
                rating = "poor"
                score = 0.0
                
            analysis[condition] = {
                "value": value,
                "rating": rating,
                "score": score
            }
            
        # Add additional analyses
        if weather.get('precipitation_type'):
            analysis['precipitation'] = self._analyze_precipitation(
                weather['precipitation_type'],
                weather.get('precipitation', 0)
            )
            
        if weather.get('wind_direction'):
            analysis['wind_direction'] = {
                "value": weather['wind_direction'],
                "implications": self._analyze_wind_direction(
                    weather['wind_direction']
                )
            }
            
        return analysis
        
    def _analyze_precipitation(self, precip_type: str, amount: float) -> Dict:
        """Analyze precipitation conditions"""
        if precip_type == 'none':
            return {
                "rating": "ideal",
                "score": 1.0,
                "implications": "Clear conditions, normal animal activity expected"
            }
            
        if precip_type == 'snow' and amount < 0.5:
            return {
                "rating": "ideal",
                "score": 0.9,
                "implications": "Light snow excellent for tracking"
            }
            
        if precip_type == 'rain' and amount < 0.1:
            return {
                "rating": "acceptable",
                "score": 0.7,
                "implications": "Light rain may mask human scent"
            }
            
        return {
            "rating": "poor",
            "score": 0.3,
            "implications": "Heavy precipitation likely to reduce animal activity"
        }
        
    def _analyze_wind_direction(self, direction: str) -> str:
        """Analyze implications of wind direction"""
        return {
            'N': "Cold front possible, watch for weather changes",
            'S': "Warmer temperatures likely, may affect animal activity",
            'E': "Storm system possible, monitor conditions",
            'W': "Weather typically stabilizing"
        }.get(direction[:1], "Monitor wind direction for hunting approach")
        
    def _analyze_pressure_trend(self, pressures: List[float]) -> Dict:
        """Analyze barometric pressure trend"""
        if len(pressures) < 2:
            return {"trend": "stable", "implications": "Stable conditions likely"}
            
        changes = np.diff(pressures)
        avg_change = np.mean(changes)
        
        if abs(avg_change) < 0.02:
            return {
                "trend": "stable",
                "implications": "Stable conditions, typical animal activity expected"
            }
        elif avg_change > 0:
            return {
                "trend": "rising",
                "implications": "Improving conditions, increased activity likely"
            }
        else:
            return {
                "trend": "falling",
                "implications": "Deteriorating conditions, monitor for weather changes"
            }
            
    def _calculate_hunting_scores(self,
                                current: Dict,
                                forecast: List[Dict]) -> Dict:
        """Calculate overall hunting condition scores"""
        # Calculate current score
        current_scores = [
            analysis['score']
            for condition, analysis in current.items()
            if isinstance(analysis, dict) and 'score' in analysis
        ]
        
        current_score = np.mean(current_scores) if current_scores else 0
        
        # Calculate trend
        forecast_scores = []
        for period in forecast:
            period_scores = [
                analysis['score']
                for condition, analysis in period.items()
                if isinstance(analysis, dict) and 'score' in analysis
            ]
            if period_scores:
                forecast_scores.append(np.mean(period_scores))
                
        trend = "improving" if len(forecast_scores) > 0 and np.mean(forecast_scores) > current_score else "deteriorating"
        
        return {
            "current_score": current_score,
            "forecast_trend": trend,
            "confidence": self._calculate_confidence_score(current, forecast)
        }
        
    def _calculate_period_score(self, conditions: Dict) -> float:
        """Calculate overall score for a time period"""
        scores = []
        weights = {
            'temperature': 1.0,
            'wind_speed': 1.0,
            'precipitation': 1.5,  # Higher weight for precipitation
            'pressure': 0.8,
            'humidity': 0.5
        }
        
        for condition, analysis in conditions.items():
            if isinstance(analysis, dict) and 'score' in analysis:
                weight = weights.get(condition, 1.0)
                scores.append(analysis['score'] * weight)
                
        return np.average(scores) if scores else 0
        
    def _calculate_confidence_score(self,
                                  current: Dict,
                                  forecast: List[Dict]) -> float:
        """Calculate confidence in the analysis"""
        # More data points = higher confidence
        data_completeness = len(current) / len(self.optimal_conditions)
        
        # More consistent forecast = higher confidence
        forecast_consistency = 1.0
        if len(forecast) > 1:
            scores = [self._calculate_period_score(f) for f in forecast]
            forecast_consistency = 1.0 - np.std(scores)
            
        return min(1.0, (data_completeness + forecast_consistency) / 2)
        
    def _generate_recommendations(self,
                                conditions: Dict,
                                scores: Dict,
                                pressure_trend: Dict) -> List[str]:
        """Generate hunting recommendations based on analysis"""
        recommendations = []
        
        # Overall condition recommendations
        if scores['current_score'] >= 0.8:
            recommendations.append(
                "Excellent hunting conditions. Focus on known animal patterns."
            )
        elif scores['current_score'] >= 0.6:
            recommendations.append(
                "Good conditions. Pay extra attention to wind direction and scent control."
            )
        else:
            recommendations.append(
                "Challenging conditions. Focus on bedding areas and travel corridors."
            )
            
        # Specific condition recommendations
        for condition, analysis in conditions.items():
            if isinstance(analysis, dict):
                if condition == 'wind_speed' and analysis.get('score', 0) < 0.6:
                    recommendations.append(
                        "Strong winds: Focus on sheltered areas and avoid ridge tops."
                    )
                elif condition == 'temperature' and analysis.get('score', 0) < 0.6:
                    if analysis['value'] > 70:
                        recommendations.append(
                            "High temperatures: Hunt early morning or late evening near water sources."
                        )
                    else:
                        recommendations.append(
                            "Cold temperatures: Focus on south-facing slopes and sunny areas."
                        )
                        
        # Pressure trend recommendations
        if pressure_trend['trend'] == 'rising':
            recommendations.append(
                "Rising pressure suggests increasing animal activity. Scout feeding areas."
            )
        elif pressure_trend['trend'] == 'falling':
            recommendations.append(
                "Falling pressure may indicate incoming weather. Focus on food sources."
            )
            
        return recommendations
        
    def _generate_period_recommendations(self, conditions: Dict) -> List[str]:
        """Generate recommendations for a specific time period"""
        recommendations = []
        
        # Temperature-based recommendations
        temp = conditions.get('temperature', {}).get('value')
        if temp:
            if temp < 30:
                recommendations.append(
                    "Focus on sunny, south-facing slopes where animals warm up"
                )
            elif temp > 70:
                recommendations.append(
                    "Target shaded areas and water sources"
                )
                
        # Wind-based recommendations
        wind = conditions.get('wind_speed', {}).get('value')
        if wind and wind > 15:
            recommendations.append(
                "Strong winds - hunt sheltered areas and use terrain for cover"
            )
            
        return recommendations
