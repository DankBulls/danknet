from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from pathlib import Path
from .terrain_service import TerrainService

class TrainingService:
    def __init__(self):
        self.data_dir = Path('data')
        self.data_dir.mkdir(exist_ok=True)
        self.terrain_service = TerrainService()
        
    def generate_synthetic_data(self, gmu_id: str, n_samples: int = 1000):
        """Generate synthetic training data for the model"""
        print("Generating synthetic training data...")
        
        # Generate random dates within the current year
        start_date = datetime(2024, 1, 1)
        dates = [start_date + timedelta(days=int(x)) for x in np.random.randint(0, 365, n_samples)]
        
        # Generate random locations within GMU bounds (using example bounds)
        lat_bounds = (37.5, 38.5)  # Example bounds for Colorado
        lon_bounds = (-106.5, -105.5)
        
        lats = np.random.uniform(lat_bounds[0], lat_bounds[1], n_samples)
        lons = np.random.uniform(lon_bounds[0], lon_bounds[1], n_samples)
        
        # Get terrain features for each location
        features = []
        for lat, lon in zip(lats, lons):
            terrain = self.terrain_service.get_terrain_features(lat, lon)
            features.append(terrain)
        
        # Create the DataFrame
        data = pd.DataFrame({
            'date': dates,
            'latitude': lats,
            'longitude': lons,
            'elevation': [f['elevation'] for f in features],
            'slope': [f['slope'] for f in features],
            'forest_density': [f['forest_density'] for f in features],
            'water_distance': [f['water_distance'] for f in features],
            'temperature': np.random.normal(15, 10, n_samples),  # Mean 15°C, std 10°C
            'precipitation': np.random.exponential(5, n_samples),  # Mean 5mm
            'wind_speed': np.random.gamma(2, 2, n_samples),  # Shape 2, scale 2
            'animal_present': np.random.binomial(1, 0.3, n_samples)  # 30% chance of presence
        })
        
        # Save to CSV
        output_file = self.data_dir / f'synthetic_data_{gmu_id}.csv'
        data.to_csv(output_file, index=False)
        print(f"Saved synthetic data to {output_file}")
        
        return data
