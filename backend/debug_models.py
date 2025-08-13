import pickle
import numpy as np

def inspect_model_file(filepath):
    try:
        with open(filepath, 'rb') as f:
            obj = pickle.load(f)
        
        print(f"\n📁 File: {filepath}")
        print(f"🔍 Type: {type(obj)}")
        print(f"📊 Shape (if array): {obj.shape if hasattr(obj, 'shape') else 'N/A'}")
        print(f"🎯 Has predict: {hasattr(obj, 'predict')}")
        
        if isinstance(obj, np.ndarray):
            print(f"⚠️ This is a numpy array, not a model!")
            print(f"   Array contains: {obj}")
            
    except Exception as e:
        print(f"❌ Error loading {filepath}: {e}")

# Check all model files
inspect_model_file('models/anemia_rf_model.pkl')
inspect_model_file('models/chronic_model.sav')
inspect_model_file('models/diabetes_model.sav')
inspect_model_file('models/heart_disease_model.sav')
inspect_model_file('models/malaria_classifier_model.keras')
# Add to your model_loader.py

