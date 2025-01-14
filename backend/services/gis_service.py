import requests
import numpy as np
from typing import Dict, List, Tuple
import os
from dotenv import load_dotenv
import geopandas as gpd
from shapely.geometry import Point, Polygon
from rtree import index

load_dotenv()

class GISService:
    def __init__(self):
        self.usgs_nhd_url = "https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer"
        self.api_key = os.getenv('USGS_API_KEY')
        self.water_features_index = None
        self.water_features = None
        self.initialize_water_features()
        
    def initialize_water_features(self):
        """Initialize water features from National Hydrography Dataset"""
        # Create R-tree index for spatial querying
        self.water_features_index = index.Index()
        
        # Load water features from local cache or download
        cache_file = "data/water_features.geojson"
        if os.path.exists(cache_file):
            self.water_features = gpd.read_file(cache_file)
        else:
            self.download_water_features()
            
        # Build spatial index
        for idx, feature in self.water_features.iterrows():
            bounds = feature.geometry.bounds
            self.water_features_index.insert(idx, bounds)
    
    def download_water_features(self):
        """Download water features from USGS National Hydrography Dataset"""
        # This would typically download from USGS NHD
        # For now, we'll create a sample dataset
        features = {
            'type': 'FeatureCollection',
            'features': [
                # Major lakes and reservoirs
                self._create_water_feature('Lake Granby', 40.1869, -105.8672, 'lake'),
                self._create_water_feature('Green Mountain Reservoir', 39.8783, -106.2347, 'reservoir'),
                self._create_water_feature('Williams Fork Reservoir', 39.9675, -106.0200, 'reservoir'),
                
                # Rivers and streams
                self._create_water_feature('Colorado River', 39.9000, -106.3000, 'river'),
                self._create_water_feature('Blue River', 39.8000, -106.1000, 'river'),
                self._create_water_feature('Williams Fork', 39.9500, -106.0500, 'stream'),
                
                # Small water bodies
                self._create_water_feature('Mountain Pond 1', 40.0500, -106.1500, 'pond'),
                self._create_water_feature('Alpine Lake 1', 40.1000, -106.2000, 'alpine_lake'),
                self._create_water_feature('Spring 1', 40.0800, -106.1800, 'spring')
            ]
        }
        
        # Save to GeoJSON file
        self.water_features = gpd.GeoDataFrame.from_features(features)
        os.makedirs('data', exist_ok=True)
        self.water_features.to_file("data/water_features.geojson", driver='GeoJSON')
    
    def _create_water_feature(self, name: str, lat: float, lon: float, type: str) -> Dict:
        """Create a GeoJSON feature for a water body"""
        return {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [lon, lat]
            },
            'properties': {
                'name': name,
                'type': type,
                'permanent': type in ['lake', 'reservoir', 'river'],
                'seasonal': type in ['stream', 'spring', 'pond']
            }
        }
    
    def find_water_features(self, lat: float, lon: float, radius_km: float = 5.0) -> List[Dict]:
        """Find water features within radius of a point"""
        # Convert radius to degrees (approximate)
        radius_deg = radius_km / 111.0  # 1 degree ≈ 111km
        
        # Create bounding box for spatial query
        bbox = (
            lon - radius_deg,
            lat - radius_deg,
            lon + radius_deg,
            lat + radius_deg
        )
        
        # Query R-tree index
        nearby_idx = list(self.water_features_index.intersection(bbox))
        
        # Filter and calculate distances
        point = Point(lon, lat)
        features = []
        
        for idx in nearby_idx:
            feature = self.water_features.iloc[idx]
            distance = point.distance(feature.geometry) * 111.0  # Convert to km
            
            if distance <= radius_km:
                features.append({
                    'name': feature['properties']['name'],
                    'type': feature['properties']['type'],
                    'distance': distance,
                    'permanent': feature['properties']['permanent'],
                    'seasonal': feature['properties']['seasonal'],
                    'coordinates': feature.geometry.coords[0]
                })
        
        return sorted(features, key=lambda x: x['distance'])
    
    def calculate_water_factor(self, lat: float, lon: float) -> float:
        """Calculate water availability factor for a location"""
        features = self.find_water_features(lat, lon)
        if not features:
            return 0.0
            
        # Weight features by distance and type
        weights = []
        for feature in features:
            # Base weight by distance (inverse relationship)
            weight = 1.0 / (1.0 + feature['distance'])
            
            # Adjust weight by type
            if feature['type'] in ['lake', 'reservoir']:
                weight *= 1.0
            elif feature['type'] == 'river':
                weight *= 0.8
            elif feature['type'] in ['stream', 'spring']:
                weight *= 0.6
            elif feature['type'] == 'pond':
                weight *= 0.4
                
            # Adjust for seasonality
            if feature['seasonal']:
                weight *= 0.7
                
            weights.append(weight)
        
        # Combine weights with diminishing returns
        return 1.0 - np.exp(-sum(weights))
