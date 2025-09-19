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

def test_users_api_logic():
    """Test the exact same logic that the users API uses"""
    try:
        initialize_firebase()
        db = get_firestore_db()

        print("=== TESTING USERS API LOGIC ===\n")

        users_ref = db.collection('users')
        query = users_ref
        all_users = query.stream()
        
        users_list = []
        for user in all_users:
            user_dict = user.to_dict()
            user_dict['id'] = user.id
            
            location = None
            if user_dict.get('location_id'):
                print(f"Processing user: {user_dict.get('name')} with location_id: {user_dict.get('location_id')}")
                location_ref = db.collection('locations').document(user_dict['location_id'])
                location_doc = location_ref.get()
                if location_doc.exists:
                    location_data = location_doc.to_dict()
                    location = {"id": location_doc.id, "name": location_data.get('name')}
                    print(f"  -> Found location: {location}")
                else:
                    print(f"  -> Location document NOT found for ID: {user_dict['location_id']}")
            else:
                print(f"User {user_dict.get('name')} has no location_id")
            
            user_dict['location'] = location
            users_list.append(user_dict)

        print(f"\n=== SUMMARY ===")
        print(f"Total users processed: {len(users_list)}")
        users_with_locations = [u for u in users_list if u.get('location')]
        users_without_locations = [u for u in users_list if not u.get('location')]
        
        print(f"Users WITH locations: {len(users_with_locations)}")
        print(f"Users WITHOUT locations: {len(users_without_locations)}")

        print(f"\nSample users with locations:")
        for user in users_with_locations[:5]:
            print(f"  - {user.get('name')}: {user.get('location', {}).get('name')}")

        print(f"\nSample users without locations:")
        for user in users_without_locations[:5]:
            print(f"  - {user.get('name')}: No location")

        return users_list

    except Exception as e:
        print(f"An error occurred: {e}")
        return []

if __name__ == '__main__':
    test_users_api_logic()