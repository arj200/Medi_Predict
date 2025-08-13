from pymongo import MongoClient
from datetime import datetime
import os
from bson import ObjectId

class MongoDB:
    def __init__(self):
        try:
            self.client = MongoClient(os.getenv('MONGODB_URI'))
            self.db = self.client.medical_diagnosis
            
            # Collections for your medical app
            self.users = self.db.users
            self.predictions = self.db.predictions
            self.consultations = self.db.consultations
            
            # ✅ FIXED: Only create indexes if connection is successful
            # Test connection first
            self.client.admin.command('ping')
            print("✅ MongoDB connection successful!")
            
            # Create indexes for better performance (only after successful connection)
            self.users.create_index("email", unique=True)
            self.users.create_index([("email", 1), ("user_type", 1)])
            
        except Exception as e:
            print(f"❌ MongoDB connection failed: {str(e)}")
            print("⚠️ Starting application without MongoDB connection...")
            # Set None values so app can still start
            self.client = None
            self.db = None
            self.users = None
            self.predictions = None
            self.consultations = None
    
    def is_connected(self):
        """Check if MongoDB is connected"""
        try:
            if self.client:
                self.client.admin.command('ping')
                return True
        except:
            pass
        return False
    
    def close(self):
        if self.client:
            self.client.close()

# Global database instance
mongo_db = MongoDB()

def get_db():
    return mongo_db
