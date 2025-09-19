import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import json
from collections import Counter

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

def analyze_user_asset_locations():
    """
    Analyze how assets are assigned to users and where those users would be located
    based on their asset assignments
    """
    try:
        initialize_firebase()
        db = get_firestore_db()

        print("=== ANALYZING USER LOCATIONS BASED ON ASSIGNED ASSETS ===\n")

        # Get all assets
        assets_ref = db.collection('assets')
        all_assets = assets_ref.stream()
        
        user_locations = {}  # user_id -> list of locations
        user_assets = {}     # user_id -> list of assets
        
        print("Processing assets...")
        asset_count = 0
        for asset_doc in all_assets:
            asset_count += 1
            asset = asset_doc.to_dict()
            asset_id = asset_doc.id
            
            # Check how users are referenced in assets
            user_ref = asset.get('user')  # DocumentReference
            assigned_user_id = asset.get('assigned_user_id')  # String ID
            location_ref = asset.get('location')  # DocumentReference
            location_id = asset.get('location_id')  # String ID
            
            # Get user identifier (could be reference or string ID)
            user_identifier = None
            if user_ref:
                user_identifier = user_ref.id if hasattr(user_ref, 'id') else str(user_ref).split('/')[-1]
            elif assigned_user_id:
                user_identifier = assigned_user_id
            
            # Get location identifier
            location_identifier = None
            if location_ref:
                location_identifier = location_ref.id if hasattr(location_ref, 'id') else str(location_ref).split('/')[-1]
            elif location_id:
                location_identifier = location_id
            
            if user_identifier and location_identifier:
                if user_identifier not in user_locations:
                    user_locations[user_identifier] = []
                    user_assets[user_identifier] = []
                
                user_locations[user_identifier].append(location_identifier)
                user_assets[user_identifier].append({
                    'asset_id': asset_id,
                    'location': location_identifier,
                    'serial_number': asset.get('serial_number'),
                    'tag_no': asset.get('tag_no')
                })
                
                if asset_count <= 5:  # Show first 5 for debugging
                    print(f"  Asset {asset_id}: User={user_identifier}, Location={location_identifier}")

        print(f"\nProcessed {asset_count} assets")
        print(f"Found {len(user_locations)} users with assigned assets\n")

        # Get actual user names
        users_ref = db.collection('users')
        user_name_map = {}
        all_users = users_ref.stream()
        for user_doc in all_users:
            user_data = user_doc.to_dict()
            user_name_map[user_doc.id] = user_data.get('name', 'Unknown')

        # Get actual location names
        locations_ref = db.collection('locations')
        location_name_map = {}
        all_locations = locations_ref.stream()
        for loc_doc in all_locations:
            loc_data = loc_doc.to_dict()
            location_name_map[loc_doc.id] = loc_data.get('name', 'Unknown')

        print("=== USER LOCATIONS BASED ON ASSIGNED ASSETS ===")
        
        for user_id, locations in user_locations.items():
            user_name = user_name_map.get(user_id, f"User ID: {user_id}")
            location_counts = Counter(locations)
            assets_count = len(user_assets[user_id])
            
            print(f"\n👤 {user_name} ({assets_count} assets):")
            
            if len(location_counts) == 1:
                # User has all assets in one location
                location_id = list(location_counts.keys())[0]
                location_name = location_name_map.get(location_id, location_id)
                print(f"   📍 PRIMARY LOCATION: {location_name}")
            else:
                # User has assets in multiple locations
                most_common_location = location_counts.most_common(1)[0]
                location_name = location_name_map.get(most_common_location[0], most_common_location[0])
                print(f"   📍 PRIMARY LOCATION: {location_name} ({most_common_location[1]} assets)")
                print(f"   📍 OTHER LOCATIONS:")
                for loc_id, count in location_counts.most_common()[1:]:
                    loc_name = location_name_map.get(loc_id, loc_id)
                    print(f"      - {loc_name} ({count} assets)")

        print(f"\n=== SUMMARY ===")
        print(f"Users with assigned assets: {len(user_locations)}")
        single_location_users = sum(1 for locs in user_locations.values() if len(set(locs)) == 1)
        multi_location_users = len(user_locations) - single_location_users
        print(f"Users in single location: {single_location_users}")
        print(f"Users in multiple locations: {multi_location_users}")

        return user_locations, user_name_map, location_name_map

    except Exception as e:
        print(f"An error occurred: {e}")
        return {}, {}, {}

if __name__ == '__main__':
    analyze_user_asset_locations()