import json
import os
from typing import Dict, List, Optional
import geopandas as gpd
from shapely.geometry import Polygon, Point
import requests
from dotenv import load_dotenv

load_dotenv()

class GMUService:
    def __init__(self):
        self.gmu_data = None
        self.load_gmu_data()
        
    def load_gmu_data(self):
        """Load GMU boundaries from GeoJSON file or create if not exists"""
        gmu_file = "data/gmu_boundaries.geojson"
        if os.path.exists(gmu_file):
            self.gmu_data = gpd.read_file(gmu_file)
        else:
            self.create_gmu_data()
            
    def create_gmu_data(self):
        """Create GMU boundary data"""
        # This would typically load from Colorado Parks & Wildlife API
        # For now, we'll create a comprehensive dataset of GMUs
        gmus = {
            # Northwest Region
            '1': {'name': 'Bears Ears', 'bounds': [40.5, 40.8, -107.5, -108.2]},
            '2': {'name': 'White River North', 'bounds': [40.1, 40.5, -107.8, -108.5]},
            '3': {'name': 'White River South', 'bounds': [39.8, 40.1, -107.5, -108.2]},
            '10': {'name': 'Flat Tops North', 'bounds': [40.0, 40.3, -107.0, -107.5]},
            '11': {'name': 'Flat Tops South', 'bounds': [39.7, 40.0, -107.2, -107.8]},
            '12': {'name': 'Gore Range', 'bounds': [39.8, 40.1, -106.3, -106.8]},
            '13': {'name': 'Eagle', 'bounds': [39.5, 39.8, -106.5, -107.0]},
            '131': {'name': 'Vail', 'bounds': [39.5, 39.7, -106.2, -106.5]},
            
            # Northeast Region
            '20': {'name': 'Medicine Bow', 'bounds': [40.8, 41.0, -106.2, -106.8]},
            '28': {'name': 'Granby', 'bounds': [40.0, 40.3, -105.7, -106.2]},
            '29': {'name': 'Poudre Canyon', 'bounds': [40.5, 40.8, -105.5, -106.0]},
            '38': {'name': 'Rocky Mountain National Park', 'bounds': [40.2, 40.5, -105.5, -105.9]},
            
            # Southeast Region
            '49': {'name': 'South Park', 'bounds': [39.0, 39.3, -105.5, -106.0]},
            '50': {'name': 'Arkansas River', 'bounds': [38.5, 38.8, -105.8, -106.3]},
            '56': {'name': 'Sangre de Cristo', 'bounds': [37.8, 38.1, -105.3, -105.8]},
            '57': {'name': 'Spanish Peaks', 'bounds': [37.5, 37.8, -105.0, -105.5]},
            
            # Southwest Region
            '61': {'name': 'San Luis Valley', 'bounds': [37.5, 37.8, -106.2, -106.7]},
            '65': {'name': 'San Juan Basin', 'bounds': [37.2, 37.5, -107.5, -108.0]},
            '70': {'name': 'West Elk', 'bounds': [38.7, 39.0, -107.0, -107.5]},
            '75': {'name': 'Uncompahgre Plateau', 'bounds': [38.2, 38.5, -108.2, -108.7]}
        }
        
        features = []
        for gmu_id, data in gmus.items():
            bounds = data['bounds']
            polygon = Polygon([
                (bounds[2], bounds[0]),  # NW
                (bounds[3], bounds[0]),  # NE
                (bounds[3], bounds[1]),  # SE
                (bounds[2], bounds[1]),  # SW
                (bounds[2], bounds[0])   # NW (close polygon)
            ])
            
            features.append({
                'type': 'Feature',
                'geometry': polygon.__geo_interface__,
                'properties': {
                    'gmu_id': gmu_id,
                    'name': data['name'],
                    'region': self._get_region(gmu_id),
                    'north': bounds[1],
                    'south': bounds[0],
                    'east': bounds[2],
                    'west': bounds[3]
                }
            })
        
        # Create GeoDataFrame and save
        self.gmu_data = gpd.GeoDataFrame.from_features(features)
        os.makedirs('data', exist_ok=True)
        self.gmu_data.to_file("data/gmu_boundaries.geojson", driver='GeoJSON')
    
    def _get_region(self, gmu_id: str) -> str:
        """Determine region based on GMU ID"""
        gmu_num = int(gmu_id)
        if gmu_num < 20:
            return 'Northwest'
        elif gmu_num < 40:
            return 'Northeast'
        elif gmu_num < 60:
            return 'Southeast'
        else:
            return 'Southwest'
    
    def get_gmu_bounds(self, gmu_id: str) -> Optional[Dict]:
        """Get boundary coordinates for a GMU"""
        if self.gmu_data is None:
            return None
            
        gmu = self.gmu_data[self.gmu_data['properties'].apply(lambda x: x['gmu_id'] == gmu_id)]
        if len(gmu) == 0:
            return None
            
        props = gmu.iloc[0]['properties']
        return {
            'north': props['north'],
            'south': props['south'],
            'east': props['east'],
            'west': props['west']
        }
    
    def get_gmu_by_location(self, lat: float, lon: float) -> Optional[Dict]:
        """Find GMU containing a point"""
        if self.gmu_data is None:
            return None
            
        point = Point(lon, lat)
        for _, gmu in self.gmu_data.iterrows():
            if gmu.geometry.contains(point):
                return gmu['properties']
        return None
    
    def get_all_gmus(self) -> List[Dict]:
        """Get list of all GMUs"""
        if self.gmu_data is None:
            return []
            
        return [gmu['properties'] for _, gmu in self.gmu_data.iterrows()]
    
    def get_gmus_by_region(self, region: str) -> List[Dict]:
        """Get list of GMUs in a region"""
        if self.gmu_data is None:
            return []
            
        return [
            gmu['properties'] 
            for _, gmu in self.gmu_data.iterrows() 
            if gmu['properties']['region'] == region
        ]
