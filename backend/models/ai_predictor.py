import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import joblib
import os

class HuntingPredictor:
    def __init__(self):
        self.success_model = None
        self.activity_model = None
        self.movement_model = None
        self.scaler = StandardScaler()
        self.load_models()
        
    def load_models(self):
        """Load pre-trained models if they exist"""
        models_dir = 'models/trained'
        if os.path.exists(f'{models_dir}/success_model.joblib'):
            self.success_model = joblib.load(f'{models_dir}/success_model.joblib')
            self.activity_model = joblib.load(f'{models_dir}/activity_model.joblib')
            self.movement_model = joblib.load(f'{models_dir}/movement_model.joblib')
        else:
            self.success_model = RandomForestRegressor(n_estimators=100)
            self.activity_model = RandomForestRegressor(n_estimators=100)
            self.movement_model = GradientBoostingClassifier(n_estimators=100)
            
    def train_success_model(self, historical_data: List[Dict]):
        """Train the success prediction model"""
        X = []
        y = []
        for record in historical_data:
            features = self._extract_success_features(record)
            X.append(features)
            y.append(record['success_rate'])
            
        X = self.scaler.fit_transform(X)
        self.success_model.fit(X, y)
        
    def train_activity_model(self, movement_data: List[Dict]):
        """Train the animal activity prediction model"""
        X = []
        y = []
        for record in movement_data:
            features = self._extract_activity_features(record)
            X.append(features)
            y.append(record['activity_level'])
            
        X = self.scaler.fit_transform(X)
        self.activity_model.fit(X, y)
        
    def train_movement_model(self, movement_data: List[Dict]):
        """Train the movement pattern prediction model"""
        X = []
        y = []
        for record in movement_data:
            features = self._extract_movement_features(record)
            X.append(features)
            y.append(record['location_type'])
            
        X = self.scaler.fit_transform(X)
        self.movement_model.fit(X, y)
        
    def predict_success(self, gmu_id: str, conditions: Dict) -> Dict:
        """Predict hunting success probability"""
        features = self._extract_success_features(conditions)
        X = self.scaler.transform([features])
        
        success_prob = self.success_model.predict(X)[0]
        confidence = self._calculate_prediction_confidence(
            self.success_model, X, success_prob
        )
        
        return {
            'success_probability': float(success_prob),
            'confidence_level': float(confidence),
            'contributing_factors': self._get_feature_importance(
                self.success_model, features
            )
        }
        
    def predict_hourly_activity(self, conditions: Dict) -> List[Dict]:
        """Predict animal activity levels for each hour"""
        predictions = []
        base_time = datetime.now()
        
        for hour in range(24):
            time = base_time + timedelta(hours=hour)
            conditions['hour'] = time.hour
            
            features = self._extract_activity_features(conditions)
            X = self.scaler.transform([features])
            
            activity_level = self.activity_model.predict(X)[0]
            confidence = self._calculate_prediction_confidence(
                self.activity_model, X, activity_level
            )
            
            predictions.append({
                'hour': time.strftime('%H:00'),
                'activity_level': float(activity_level),
                'confidence': float(confidence),
                'factors': self._get_feature_importance(
                    self.activity_model, features
                )
            })
            
        return predictions
        
    def predict_movement_patterns(self, conditions: Dict) -> Dict:
        """Predict likely animal locations and movement patterns"""
        features = self._extract_movement_features(conditions)
        X = self.scaler.transform([features])
        
        location_probs = self.movement_model.predict_proba(X)[0]
        location_types = self.movement_model.classes_
        
        patterns = []
        for loc_type, prob in zip(location_types, location_probs):
            if prob > 0.2:  # Only include significant probabilities
                patterns.append({
                    'location_type': loc_type,
                    'probability': float(prob),
                    'confidence': self._calculate_prediction_confidence(
                        self.movement_model, X, prob
                    )
                })
                
        return {
            'predicted_patterns': patterns,
            'factors': self._get_feature_importance(
                self.movement_model, features
            )
        }
        
    def _extract_success_features(self, conditions: Dict) -> List[float]:
        """Extract features for success prediction"""
        return [
            conditions.get('temperature', 0),
            conditions.get('wind_speed', 0),
            conditions.get('precipitation', 0),
            conditions.get('pressure', 0),
            conditions.get('humidity', 0),
            conditions.get('moon_phase', 0),
            conditions.get('season_factor', 0),
            conditions.get('elevation', 0)
        ]
        
    def _extract_activity_features(self, conditions: Dict) -> List[float]:
        """Extract features for activity prediction"""
        return [
            conditions.get('hour', 0),
            conditions.get('temperature', 0),
            conditions.get('wind_speed', 0),
            conditions.get('precipitation', 0),
            conditions.get('light_level', 0),
            conditions.get('moon_phase', 0),
            conditions.get('pressure_trend', 0)
        ]
        
    def _extract_movement_features(self, conditions: Dict) -> List[float]:
        """Extract features for movement prediction"""
        return [
            conditions.get('hour', 0),
            conditions.get('temperature', 0),
            conditions.get('wind_speed', 0),
            conditions.get('precipitation', 0),
            conditions.get('elevation', 0),
            conditions.get('slope', 0),
            conditions.get('aspect', 0),
            conditions.get('distance_to_water', 0)
        ]
        
    def _calculate_prediction_confidence(self, model, X, prediction) -> float:
        """Calculate confidence level for a prediction"""
        if hasattr(model, 'estimators_'):
            # For ensemble models, use the variance of predictions
            predictions = np.array([tree.predict(X)[0] 
                                 for tree in model.estimators_])
            confidence = 1.0 - (np.std(predictions) / np.mean(predictions))
            return max(min(confidence, 1.0), 0.0)
        return 0.8  # Default confidence if can't calculate
        
    def _get_feature_importance(self, model, features: List[float]) -> Dict:
        """Get the importance of each feature in the prediction"""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            return {
                f'feature_{i}': float(imp)
                for i, imp in enumerate(importances)
            }
        return {}
