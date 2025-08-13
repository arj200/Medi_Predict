import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
import pickle

class DataPreprocessor:
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.feature_ranges = {
            'anemia': {
                'hemoglobin': (0, 20),
                'mch': (10, 50),
                'mchc': (20, 40),
                'mcv': (60, 120)
            },
            'diabetes': {
                'glucose': (0, 300),
                'bloodpressure': (0, 200),
                'skinthickness': (0, 100),
                'insulin': (0, 1000),
                'bmi': (10, 60),
                'diabetespedigreefunction': (0, 3),
                'age': (0, 120)
            },
            'heart_disease': {
                'age': (0, 120),
                'trestbps': (80, 200),
                'chol': (100, 600),
                'thalach': (60, 220),
                'oldpeak': (0, 10)
            },
            'chronic': {
                'age': (0, 120),
                'blood_pressure': (80, 200),
                'cholesterol_level': (100, 400)
            }
        }
    
    def validate_features(self, disease, features):
        """Validate input features for a specific disease"""
        if disease not in self.feature_ranges:
            raise ValueError(f"Unknown disease: {disease}")
        
        ranges = self.feature_ranges[disease]
        validated_features = []
        
        for i, (feature_name, (min_val, max_val)) in enumerate(ranges.items()):
            if i < len(features):
                value = float(features[i])
                # Clamp values to valid range
                value = max(min_val, min(max_val, value))
                validated_features.append(value)
            else:
                validated_features.append(min_val)  # Default to minimum
        
        return validated_features
    
    def preprocess_for_prediction(self, disease, features):
        """Preprocess features for model prediction"""
        validated = self.validate_features(disease, features)
        return np.array(validated).reshape(1, -1)
