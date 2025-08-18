import firebase_admin
from firebase_admin import credentials, firestore
import os

def initialize_firebase():
    service_account_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    if not service_account_key_path:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable not set.")
    cred = credentials.Certificate(service_account_key_path)
    firebase_admin.initialize_app(cred)

def get_firestore_db():
    return firestore.client()
