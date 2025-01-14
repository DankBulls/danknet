import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv('OPENWEATHER_API_KEY')
        self.base_url = 'https://api.openweathermap.org/data/3.0'
        
    def get_current_weather(self, lat: float, lon: float) -> Dict:
        """Get current weather conditions"""
        url = f'{self.base_url}/weather'
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'imperial'
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return self._get_default_weather()
            
        data = response.json()
        return self._format_current_weather(data)
        
    def get_forecast(self, lat: float, lon: float, days: int = 5) -> List[Dict]:
        """Get weather forecast"""
        url = f'{self.base_url}/forecast'
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'imperial'
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return [self._get_default_weather() for _ in range(days)]
            
        data = response.json()
        return self._format_forecast(data, days)
        
    def get_historical_weather(self, lat: float, lon: float, 
                             start_date: datetime,
                             end_date: datetime) -> List[Dict]:
        """Get historical weather data"""
        url = f'{self.base_url}/history'
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'imperial',
            'start': int(start_date.timestamp()),
            'end': int(end_date.timestamp())
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return []
            
        data = response.json()
        return self._format_historical_weather(data)
        
    def analyze_hunting_conditions(self, weather_data: Dict) -> Dict:
        """Analyze weather conditions for hunting"""
        temp = weather_data.get('temperature', 45)
        wind_speed = weather_data.get('wind_speed', 0)
        precipitation = weather_data.get('precipitation', 0)
        
        # Temperature analysis
        temp_score = self._calculate_temperature_score(temp)
        
        # Wind analysis
        wind_score = self._calculate_wind_score(wind_speed)
        
        # Precipitation analysis
        precip_score = self._calculate_precipitation_score(
            precipitation, weather_data.get('precipitation_type')
        )
        
        overall_score = (temp_score + wind_score + precip_score) / 3
        
        return {
            'overall_rating': self._get_condition_rating(overall_score),
            'temperature': {
                'value': temp,
                'rating': self._get_condition_rating(temp_score),
                'explanation': self._get_temperature_explanation(temp)
            },
            'wind': {
                'speed': wind_speed,
                'direction': weather_data.get('wind_direction', 'N'),
                'rating': self._get_condition_rating(wind_score),
                'explanation': self._get_wind_explanation(wind_speed)
            },
            'precipitation': {
                'amount': precipitation,
                'type': weather_data.get('precipitation_type', 'none'),
                'rating': self._get_condition_rating(precip_score),
                'explanation': self._get_precipitation_explanation(
                    precipitation, weather_data.get('precipitation_type')
                )
            }
        }
        
    def _format_current_weather(self, data: Dict) -> Dict:
        """Format current weather data"""
        return {
            'temperature': data.get('main', {}).get('temp'),
            'feels_like': data.get('main', {}).get('feels_like'),
            'humidity': data.get('main', {}).get('humidity'),
            'pressure': data.get('main', {}).get('pressure'),
            'wind_speed': data.get('wind', {}).get('speed'),
            'wind_direction': self._degrees_to_direction(
                data.get('wind', {}).get('deg', 0)
            ),
            'precipitation': data.get('rain', {}).get('1h', 0),
            'precipitation_type': self._get_precipitation_type(data),
            'cloud_cover': data.get('clouds', {}).get('all', 0),
            'visibility': data.get('visibility', 10000) / 1000,  # Convert to km
            'timestamp': datetime.fromtimestamp(data.get('dt', 0))
        }
        
    def _format_forecast(self, data: Dict, days: int) -> List[Dict]:
        """Format forecast data"""
        forecast = []
        current_date = None
        daily_data = {}
        
        for item in data.get('list', []):
            date = datetime.fromtimestamp(item['dt']).date()
            
            if current_date != date:
                if current_date is not None:
                    forecast.append(self._aggregate_daily_forecast(daily_data))
                    if len(forecast) >= days:
                        break
                        
                current_date = date
                daily_data = {
                    'date': date,
                    'temps': [],
                    'wind_speeds': [],
                    'precipitation': 0,
                    'precipitation_types': set()
                }
                
            temp = item.get('main', {}).get('temp')
            if temp:
                daily_data['temps'].append(temp)
                
            wind_speed = item.get('wind', {}).get('speed')
            if wind_speed:
                daily_data['wind_speeds'].append(wind_speed)
                
            precip = (
                item.get('rain', {}).get('3h', 0) +
                item.get('snow', {}).get('3h', 0)
            )
            daily_data['precipitation'] += precip
            
            precip_type = self._get_precipitation_type(item)
            if precip_type != 'none':
                daily_data['precipitation_types'].add(precip_type)
                
        if daily_data and len(forecast) < days:
            forecast.append(self._aggregate_daily_forecast(daily_data))
            
        return forecast
        
    def _format_historical_weather(self, data: Dict) -> List[Dict]:
        """Format historical weather data"""
        return [self._format_current_weather(item) for item in data.get('list', [])]
        
    def _get_default_weather(self) -> Dict:
        """Return default weather data when API fails"""
        return {
            'temperature': 45,
            'feels_like': 45,
            'humidity': 50,
            'pressure': 1013,
            'wind_speed': 5,
            'wind_direction': 'N',
            'precipitation': 0,
            'precipitation_type': 'none',
            'cloud_cover': 0,
            'visibility': 10,
            'timestamp': datetime.now()
        }
        
    def _degrees_to_direction(self, degrees: float) -> str:
        """Convert wind degrees to cardinal direction"""
        directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        index = round(degrees / (360 / len(directions))) % len(directions)
        return directions[index]
        
    def _get_precipitation_type(self, data: Dict) -> str:
        """Determine precipitation type from weather data"""
        if data.get('snow'):
            return 'snow'
        elif data.get('rain'):
            return 'rain'
        return 'none'
        
    def _aggregate_daily_forecast(self, daily_data: Dict) -> Dict:
        """Aggregate hourly forecast data into daily summary"""
        return {
            'date': daily_data['date'],
            'temperature_high': max(daily_data['temps']),
            'temperature_low': min(daily_data['temps']),
            'temperature_avg': sum(daily_data['temps']) / len(daily_data['temps']),
            'wind_speed_avg': sum(daily_data['wind_speeds']) / len(daily_data['wind_speeds']),
            'wind_speed_max': max(daily_data['wind_speeds']),
            'precipitation': daily_data['precipitation'],
            'precipitation_types': list(daily_data['precipitation_types'])
        }
        
    def _calculate_temperature_score(self, temp: float) -> float:
        """Calculate score for temperature conditions"""
        # Optimal temperature range for hunting: 30-60°F
        if 30 <= temp <= 60:
            return 1.0 - abs(45 - temp) / 15  # 45°F is optimal
        return max(0, 1 - abs(45 - temp) / 45)
        
    def _calculate_wind_score(self, wind_speed: float) -> float:
        """Calculate score for wind conditions"""
        # Optimal wind speed: 5-15 mph
        if wind_speed < 5:
            return 0.7  # Too calm
        elif 5 <= wind_speed <= 15:
            return 1.0
        else:
            return max(0, 1 - (wind_speed - 15) / 15)
            
    def _calculate_precipitation_score(self, amount: float, 
                                    precip_type: Optional[str]) -> float:
        """Calculate score for precipitation conditions"""
        if precip_type == 'none':
            return 0.8
        elif precip_type == 'snow' and amount < 0.5:
            return 1.0  # Light snow is optimal
        elif precip_type == 'rain' and amount < 0.1:
            return 0.7  # Light rain is acceptable
        else:
            return max(0, 1 - amount)
            
    def _get_condition_rating(self, score: float) -> str:
        """Convert numerical score to rating"""
        if score >= 0.8:
            return 'excellent'
        elif score >= 0.6:
            return 'good'
        elif score >= 0.4:
            return 'fair'
        else:
            return 'poor'
            
    def _get_temperature_explanation(self, temp: float) -> str:
        """Get explanation for temperature conditions"""
        if 30 <= temp <= 60:
            return "Ideal temperature range for animal activity"
        elif temp < 30:
            return "Cold temperatures may reduce animal movement"
        else:
            return "Warm temperatures may limit animal activity"
            
    def _get_wind_explanation(self, wind_speed: float) -> str:
        """Get explanation for wind conditions"""
        if wind_speed < 5:
            return "Very calm conditions may make scent detection difficult"
        elif 5 <= wind_speed <= 15:
            return "Good wind conditions for scent carrying"
        else:
            return "Strong winds may affect animal behavior and shooting accuracy"
            
    def _get_precipitation_explanation(self, amount: float, 
                                    precip_type: Optional[str]) -> str:
        """Get explanation for precipitation conditions"""
        if precip_type == 'none':
            return "Clear conditions, typical animal activity expected"
        elif precip_type == 'snow' and amount < 0.5:
            return "Light snow is excellent for tracking"
        elif precip_type == 'rain' and amount < 0.1:
            return "Light rain may mask human scent"
        else:
            return "Heavy precipitation may reduce animal activity"
