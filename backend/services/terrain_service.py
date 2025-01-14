import numpy as np
import requests
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class TerrainService:
    def __init__(self):
        self.data_dir = Path('data')
        self.data_dir.mkdir(exist_ok=True)
        self.elevation_cache = {}
        self.water_features = self._load_water_features()
        
    def _load_water_features(self):
        """Load water features from file or return empty data if file doesn't exist"""
        water_file = self.data_dir / 'water_features.json'
        if water_file.exists():
            try:
                with open(water_file) as f:
                    return json.load(f)
            except json.JSONDecodeError:
                logger.warning("Error loading water features file")
        return {'features': []}
        
    def get_elevation(self, lat: float, lng: float) -> float:
        """Get elevation data for a location (using mock data for development)"""
        # Mock elevation based on latitude and longitude
        base_elevation = 2000.0  # Base elevation in meters
        lat_factor = abs(lat - 40) * 100  # Elevation varies with distance from 40°N
        lng_factor = abs(lng + 105) * 50  # Elevation varies with distance from 105°W
        
        # Add some random variation
        random_factor = np.random.normal(0, 100)
        elevation = base_elevation + lat_factor + lng_factor + random_factor
        
        return max(1500.0, min(4000.0, elevation))  # Keep elevation between 1500m and 4000m
            
    def get_slope(self, lat: float, lng: float) -> float:
        """Calculate slope using surrounding elevation points"""
        # Mock slope calculation based on location
        base_slope = 10.0  # Base slope in degrees
        lat_factor = abs(lat - 40) * 5  # Slope varies with distance from 40°N
        lng_factor = abs(lng + 105) * 2  # Slope varies with distance from 105°W
        
        # Add some random variation
        random_factor = np.random.normal(0, 2)
        slope = base_slope + lat_factor + lng_factor + random_factor
        
        return max(0.0, min(45.0, slope))  # Keep slope between 0° and 45°
            
    def get_forest_density(self, lat: float, lng: float) -> float:
        """Get forest density (using mock data for development)"""
        # Mock forest density based on elevation and slope
        elevation = self.get_elevation(lat, lng)
        slope = self.get_slope(lat, lng)
        
        # Forest density increases with elevation up to a point, then decreases
        elevation_factor = 1 - abs(elevation - 2500) / 2000
        
        # Forest density decreases with slope
        slope_factor = 1 - slope / 45
        
        # Add some random variation
        random_factor = np.random.normal(0, 0.1)
        
        density = 0.5 * elevation_factor + 0.3 * slope_factor + random_factor
        return max(0.0, min(1.0, density))
            
    def find_nearest_water(self, lat: float, lng: float) -> tuple:
        """Find distance to nearest water feature (using mock data for development)"""
        # Mock water distance based on location
        base_distance = 1.0  # Base distance in kilometers
        lat_factor = abs(lat - 40) * 0.5  # Distance varies with latitude
        lng_factor = abs(lng + 105) * 0.2  # Distance varies with longitude
        
        # Add some random variation
        random_factor = np.random.normal(0, 0.2)
        distance = base_distance + lat_factor + lng_factor + random_factor
        
        return max(0.1, distance), None  # Ensure minimum distance of 100m
        
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate haversine distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        return R * c
        
    def get_terrain_features(self, lat: float, lng: float) -> dict:
        """Get all terrain features for a location"""
        elevation = self.get_elevation(lat, lng)
        slope = self.get_slope(lat, lng)
        forest_density = self.get_forest_density(lat, lng)
        water_distance, _ = self.find_nearest_water(lat, lng)
        
        return {
            'elevation': elevation,
            'slope': slope,
            'forest_density': forest_density,
            'water_distance': water_distance
        }
