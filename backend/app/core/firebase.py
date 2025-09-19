import firebase_admin
from firebase_admin import credentials, firestore
import os

def initialize_firebase():
    service_account_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    if not service_account_key_path:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable not set.")
    
    # Look for the file relative to the backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    absolute_key_path = os.path.join(backend_dir, service_account_key_path)
    
    if not os.path.exists(absolute_key_path):
        raise FileNotFoundError(f"Firebase service account key file not found at: {absolute_key_path}")
    
    cred = credentials.Certificate(absolute_key_path)
    firebase_admin.initialize_app(cred)

def get_firestore_db():
    return firestore.client()
