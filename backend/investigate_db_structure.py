import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

def initialize_firebase():
    service_account_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    if not service_account_key_path:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable not set.")
    
    # Look for the file in the current directory (backend folder)
    absolute_key_path = os.path.join(os.path.dirname(__file__), service_account_key_path)

    if not os.path.exists(absolute_key_path):
        raise FileNotFoundError(f"Firebase service account key file not found at: {absolute_key_path}")

    if not firebase_admin._apps:
        cred = credentials.Certificate(absolute_key_path)
        firebase_admin.initialize_app(cred)

def get_firestore_db():
    return firestore.client()

def investigate_data_structure():
    try:
        initialize_firebase()
        db = get_firestore_db()

        print("=== INVESTIGATING DATABASE STRUCTURE ===\n")

        # 1. Check a sample user from users collection
        print("1. Sample User from 'users' collection:")
        users_ref = db.collection('users')
        sample_users = users_ref.limit(3).stream()
        
        for user in sample_users:
            user_data = user.to_dict()
            print(f"   User ID: {user.id}")
            print(f"   User Data: {json.dumps(user_data, indent=4, default=str)}")
            print("-" * 50)

        # 2. Check a sample asset to see how users are referenced there
        print("\n2. Sample Asset from 'assets' collection (to see user references):")
        assets_ref = db.collection('assets')
        sample_assets = assets_ref.limit(2).stream()
        
        for asset in sample_assets:
            asset_data = asset.to_dict()
            print(f"   Asset ID: {asset.id}")
            print(f"   Asset Data: {json.dumps(asset_data, indent=4, default=str)}")
            print("-" * 50)

        # 3. Check a sample location
        print("\n3. Sample Location from 'locations' collection:")
        locations_ref = db.collection('locations')
        sample_locations = locations_ref.limit(2).stream()
        
        for location in sample_locations:
            location_data = location.to_dict()
            print(f"   Location ID: {location.id}")
            print(f"   Location Data: {json.dumps(location_data, indent=4, default=str)}")
            print("-" * 50)

        # 4. Check if there are any users with location_id that actually exist
        print("\n4. Checking users with location_id:")
        users_with_location = users_ref.where('location_id', '!=', None).limit(3).stream()
        
        for user in users_with_location:
            user_data = user.to_dict()
            location_id = user_data.get('location_id')
            print(f"   User: {user_data.get('name')} has location_id: {location_id}")
            
            # Try to fetch the referenced location
            if location_id:
                try:
                    location_ref = db.collection('locations').document(location_id)
                    location_doc = location_ref.get()
                    if location_doc.exists:
                        print(f"   -> Location exists: {location_doc.to_dict()}")
                    else:
                        print(f"   -> Location NOT found for ID: {location_id}")
                except Exception as e:
                    print(f"   -> Error fetching location: {e}")
            print("-" * 30)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    investigate_data_structure()