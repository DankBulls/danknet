import numpy as np
from datetime import datetime
import os
from pathlib import Path
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
from services.training_service import TrainingService

class GamePredictor:
    def __init__(self, db_session=None):
        self.model = None
        self.training_service = TrainingService()
        self.feature_columns = [
            'elevation', 'slope', 'forest_density', 'water_distance',
            'temperature', 'precipitation', 'wind_speed'
        ]
        self.initialize_model()

    def initialize_model(self):
        """Initialize and train the model for game prediction"""
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Create data directory if it doesn't exist
        data_dir = Path('data')
        data_dir.mkdir(exist_ok=True)
        model_path = data_dir / 'model.pkl'
        
        # Train the model if no saved weights exist
        if not model_path.exists():
            self.train_model()
        else:
            self.model = joblib.load(model_path)

    def train_model(self):
        """Train the model using synthetic data"""
        # Generate synthetic data for training
        gmu_id = '28'  # Example GMU
        n_samples = 1000
        data = self.training_service.generate_synthetic_data(gmu_id, n_samples)
        
        # Prepare features and target
        X = data[self.feature_columns]
        y = data['animal_present']
        
        # Train the model
        self.model.fit(X, y)
        
        # Save the trained model
        model_path = Path('data') / 'model.pkl'
        joblib.dump(self.model, model_path)

    def predict(self, features):
        """Make predictions using the trained model"""
        if self.model is None:
            self.initialize_model()
            
        # Ensure features match expected columns
        X = pd.DataFrame([features])[self.feature_columns]
        return self.model.predict_proba(X)[0][1]  # Return probability of presence

    def get_hotspots(self, bounds):
        """Get hunting hotspots within the given bounds"""
        # Generate a grid of points within the bounds
        lat_points = np.linspace(bounds['south'], bounds['north'], 10)
        lon_points = np.linspace(bounds['west'], bounds['east'], 10)
        
        hotspots = []
        for lat in lat_points:
            for lon in lon_points:
                # Get terrain features from the training service
                terrain = self.training_service.terrain_service.get_terrain_features(lat, lon)
                
                # Add weather features (using defaults for now)
                features = {
                    **terrain,
                    'temperature': 15.0,  # Default temperature
                    'precipitation': 0.0,  # Default precipitation
                    'wind_speed': 5.0,    # Default wind speed
                }
                
                # Get prediction for this location
                probability = self.predict(features)
                
                if probability > 0.5:  # Only include likely spots
                    hotspots.append({
                        'lat': lat,
                        'lon': lon,
                        'probability': probability,
                        'terrain': terrain
                    })
        
        return sorted(hotspots, key=lambda x: x['probability'], reverse=True)
