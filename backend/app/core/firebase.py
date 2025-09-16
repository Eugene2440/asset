import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

def initialize_firebase():
    # Try to use environment variables first
    firebase_config = {
        "type": "service_account",
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        "private_key": os.getenv("FIREBASE_PRIVATE_KEY"),
        "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
        "client_id": os.getenv("FIREBASE_CLIENT_ID"),
        "auth_uri": os.getenv("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
        "token_uri": os.getenv("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
        "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL")
    }
    
    # Check if all required environment variables are set
    if all(firebase_config[key] for key in ["project_id", "private_key", "client_email"]):
        # Replace escaped newlines in private key
        if firebase_config["private_key"]:
            firebase_config["private_key"] = firebase_config["private_key"].replace("\\n", "\n")
        cred = credentials.Certificate(firebase_config)
    else:
        # Fallback to service account key file if environment variables are not set
        service_account_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
        if not service_account_key_path:
            raise ValueError("Firebase configuration not found. Either set environment variables or FIREBASE_SERVICE_ACCOUNT_KEY_PATH.")
        cred = credentials.Certificate(service_account_key_path)
    
    firebase_admin.initialize_app(cred)

def get_firestore_db():
    return firestore.client()
