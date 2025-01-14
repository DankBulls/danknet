import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import os

class MLService:
    def __init__(self):
        self.models_dir = 'models'
        self.scalers = {}
        self.label_encoders = {}
        self.models = {
            'movement': None,
            'behavior': None,
            'success': None
        }
        self._load_models()

    def _load_models(self):
        """Load pre-trained models if they exist"""
        if not os.path.exists(self.models_dir):
            os.makedirs(self.models_dir)

        for model_type in self.models.keys():
            model_path = os.path.join(self.models_dir, f'{model_type}_model.joblib')
            scaler_path = os.path.join(self.models_dir, f'{model_type}_scaler.joblib')
            encoder_path = os.path.join(self.models_dir, f'{model_type}_encoder.joblib')

            if os.path.exists(model_path):
                self.models[model_type] = joblib.load(model_path)
            if os.path.exists(scaler_path):
                self.scalers[model_type] = joblib.load(scaler_path)
            if os.path.exists(encoder_path):
                self.label_encoders[model_type] = joblib.load(encoder_path)

    def _save_model(self, model_type: str):
        """Save model and its preprocessing components"""
        model_path = os.path.join(self.models_dir, f'{model_type}_model.joblib')
        scaler_path = os.path.join(self.models_dir, f'{model_type}_scaler.joblib')
        encoder_path = os.path.join(self.models_dir, f'{model_type}_encoder.joblib')

        joblib.dump(self.models[model_type], model_path)
        if model_type in self.scalers:
            joblib.dump(self.scalers[model_type], scaler_path)
        if model_type in self.label_encoders:
            joblib.dump(self.label_encoders[model_type], encoder_path)

    def train_movement_model(self, historical_data: pd.DataFrame):
        """Train movement pattern prediction model"""
        # Prepare features
        features = [
            'time_of_day', 'day_of_week', 'month', 'temperature',
            'wind_speed', 'precipitation', 'pressure', 'cloud_cover',
            'terrain_type', 'elevation', 'animal_type'
        ]
        target = 'movement_vector'

        # Encode categorical variables
        self.label_encoders['movement'] = LabelEncoder()
        historical_data['terrain_type'] = self.label_encoders['movement'].fit_transform(
            historical_data['terrain_type']
        )
        historical_data['animal_type'] = self.label_encoders['movement'].fit_transform(
            historical_data['animal_type']
        )

        # Scale numerical features
        self.scalers['movement'] = StandardScaler()
        X = self.scalers['movement'].fit_transform(historical_data[features])
        y = historical_data[target]

        # Train model
        self.models['movement'] = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5
        )
        self.models['movement'].fit(X, y)
        self._save_model('movement')

    def train_behavior_model(self, historical_data: pd.DataFrame):
        """Train animal behavior prediction model"""
        features = [
            'time_of_day', 'day_of_week', 'month', 'temperature',
            'elevation', 'animal_type', 'season', 'lunar_phase'
        ]
        target = 'behavior_factor'

        # Encode categorical variables
        self.label_encoders['behavior'] = LabelEncoder()
        historical_data['animal_type'] = self.label_encoders['behavior'].fit_transform(
            historical_data['animal_type']
        )
        historical_data['season'] = self.label_encoders['behavior'].fit_transform(
            historical_data['season']
        )

        # Scale numerical features
        self.scalers['behavior'] = StandardScaler()
        X = self.scalers['behavior'].fit_transform(historical_data[features])
        y = historical_data[target]

        # Train model
        self.models['behavior'] = RandomForestRegressor(
            n_estimators=100,
            max_depth=10
        )
        self.models['behavior'].fit(X, y)
        self._save_model('behavior')

    def train_success_model(self, historical_data: pd.DataFrame):
        """Train hunting success prediction model"""
        features = [
            'time_of_day', 'day_of_week', 'month', 'temperature',
            'wind_speed', 'precipitation', 'pressure', 'cloud_cover',
            'terrain_type', 'elevation', 'animal_type', 'behavior_factor'
        ]
        target = 'success_rate'

        # Encode categorical variables
        self.label_encoders['success'] = LabelEncoder()
        historical_data['terrain_type'] = self.label_encoders['success'].fit_transform(
            historical_data['terrain_type']
        )
        historical_data['animal_type'] = self.label_encoders['success'].fit_transform(
            historical_data['animal_type']
        )

        # Scale numerical features
        self.scalers['success'] = StandardScaler()
        X = self.scalers['success'].fit_transform(historical_data[features])
        y = historical_data[target]

        # Train model
        self.models['success'] = RandomForestRegressor(
            n_estimators=200,
            max_depth=15
        )
        self.models['success'].fit(X, y)
        self._save_model('success')

    def predict_movement(self,
                        time_of_day: float,
                        day_of_week: int,
                        month: int,
                        weather_data: Dict,
                        terrain_data: Dict,
                        animal_type: str) -> Dict:
        """Predict animal movement patterns"""
        if not self.models['movement']:
            raise ValueError("Movement model not trained")

        # Prepare features
        features = np.array([[
            time_of_day,
            day_of_week,
            month,
            weather_data['temperature'],
            weather_data['wind_speed'],
            weather_data['precipitation'],
            weather_data['pressure'],
            weather_data['cloud_cover'],
            self.label_encoders['movement'].transform([terrain_data['type']])[0],
            terrain_data['elevation'],
            self.label_encoders['movement'].transform([animal_type])[0]
        ]])

        # Scale features
        features_scaled = self.scalers['movement'].transform(features)

        # Make prediction
        movement_vector = self.models['movement'].predict(features_scaled)[0]
        confidence = self._calculate_confidence(
            self.models['movement'],
            features_scaled,
            movement_vector
        )

        return {
            'movement_vector': movement_vector,
            'confidence': confidence
        }

    def predict_behavior(self,
                        time_of_day: float,
                        day_of_week: int,
                        month: int,
                        temperature: float,
                        elevation: float,
                        animal_type: str,
                        season: str,
                        lunar_phase: float) -> Dict:
        """Predict animal behavior factors"""
        if not self.models['behavior']:
            raise ValueError("Behavior model not trained")

        # Prepare features
        features = np.array([[
            time_of_day,
            day_of_week,
            month,
            temperature,
            elevation,
            self.label_encoders['behavior'].transform([animal_type])[0],
            self.label_encoders['behavior'].transform([season])[0],
            lunar_phase
        ]])

        # Scale features
        features_scaled = self.scalers['behavior'].transform(features)

        # Make prediction
        behavior_factor = self.models['behavior'].predict(features_scaled)[0]
        confidence = self._calculate_confidence(
            self.models['behavior'],
            features_scaled,
            behavior_factor
        )

        return {
            'behavior_factor': behavior_factor,
            'confidence': confidence
        }

    def predict_success(self,
                       time_of_day: float,
                       day_of_week: int,
                       month: int,
                       weather_data: Dict,
                       terrain_data: Dict,
                       animal_type: str,
                       behavior_factor: float) -> Dict:
        """Predict hunting success probability"""
        if not self.models['success']:
            raise ValueError("Success model not trained")

        # Prepare features
        features = np.array([[
            time_of_day,
            day_of_week,
            month,
            weather_data['temperature'],
            weather_data['wind_speed'],
            weather_data['precipitation'],
            weather_data['pressure'],
            weather_data['cloud_cover'],
            self.label_encoders['success'].transform([terrain_data['type']])[0],
            terrain_data['elevation'],
            self.label_encoders['success'].transform([animal_type])[0],
            behavior_factor
        ]])

        # Scale features
        features_scaled = self.scalers['success'].transform(features)

        # Make prediction
        success_rate = self.models['success'].predict(features_scaled)[0]
        confidence = self._calculate_confidence(
            self.models['success'],
            features_scaled,
            success_rate
        )

        return {
            'success_rate': success_rate,
            'confidence': confidence
        }

    def _calculate_confidence(self,
                            model,
                            features: np.ndarray,
                            prediction: float) -> float:
        """Calculate confidence score for a prediction"""
        if hasattr(model, 'predict_proba'):
            # For models that support probability estimation
            probas = model.predict_proba(features)
            confidence = np.max(probas)
        else:
            # For models without probability estimation,
            # use the standard deviation of predictions from individual trees
            if isinstance(model, (RandomForestRegressor, GradientBoostingRegressor)):
                predictions = np.array([
                    tree.predict(features)
                    for tree in model.estimators_
                ])
                confidence = 1.0 - min(1.0, np.std(predictions))
            else:
                # Default confidence based on feature similarity
                confidence = 0.8  # Base confidence

        return float(confidence)

    def get_feature_importance(self, model_type: str) -> Dict[str, float]:
        """Get feature importance for a specific model"""
        if model_type not in self.models or not self.models[model_type]:
            raise ValueError(f"Model {model_type} not found or not trained")

        model = self.models[model_type]
        if not hasattr(model, 'feature_importances_'):
            raise ValueError(f"Model {model_type} doesn't support feature importance")

        feature_names = {
            'movement': [
                'time_of_day', 'day_of_week', 'month', 'temperature',
                'wind_speed', 'precipitation', 'pressure', 'cloud_cover',
                'terrain_type', 'elevation', 'animal_type'
            ],
            'behavior': [
                'time_of_day', 'day_of_week', 'month', 'temperature',
                'elevation', 'animal_type', 'season', 'lunar_phase'
            ],
            'success': [
                'time_of_day', 'day_of_week', 'month', 'temperature',
                'wind_speed', 'precipitation', 'pressure', 'cloud_cover',
                'terrain_type', 'elevation', 'animal_type', 'behavior_factor'
            ]
        }

        return dict(zip(
            feature_names[model_type],
            model.feature_importances_
        ))
