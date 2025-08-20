import os
import re
import pandas as pd
from dotenv import load_dotenv
import io
import firebase_admin
from firebase_admin import credentials, firestore

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

def initialize_firebase():
    service_account_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    if not service_account_key_path:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable not set.")
    
    # Construct the absolute path to the service account key file
    # Assuming the path in .env is relative to the project root (inventory folder)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    absolute_key_path = os.path.join(project_root, service_account_key_path)

    if not os.path.exists(absolute_key_path):
        raise FileNotFoundError(f"Firebase service account key file not found at: {absolute_key_path}")

    # Check if the app is already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate(absolute_key_path)
        firebase_admin.initialize_app(cred)

def get_firestore_db():
    return firestore.client()

def import_data_to_firestore(js_filepath):
    try:
        initialize_firebase()
        db = get_firestore_db()

        with open(js_filepath, 'r', encoding='utf-8') as f:
            js_content = f.read()

        match = re.search(r'`([^`]+)`', js_content, re.DOTALL)
        if not match:
            print("Error: Could not find CSV data string in data.js file.")
            return

        csv_string = match.group(1).strip()
        data = io.StringIO(csv_string)
        df = pd.read_csv(data)
        df.columns = df.columns.str.strip()
        df = df.where(pd.notna(df), None) # Replace NaN with None

        print("Populating lookup collections...")

        # Populate Locations
        locations_ref = db.collection('locations')
        for loc in df['Location'].dropna().unique():
            loc_doc = locations_ref.document(loc.replace('/', '-')) # Use name as ID, replace invalid chars
            loc_doc.set({'name': loc}, merge=True)

        # Populate Users
        users_ref = db.collection('users')
        for user in df['User Allocated'].dropna().unique():
            user_doc = users_ref.document(user.replace('/', '-'))
            user_doc.set({'name': user}, merge=True)

        # Populate Asset Statuses
        asset_statuses_ref = db.collection('asset_statuses')
        for status in df['Asset Status'].dropna().unique():
            status_doc = asset_statuses_ref.document(status.replace('/', '-'))
            status_doc.set({'status_name': status}, merge=True)

        # Populate Asset Models
        asset_models_ref = db.collection('asset_models')
        for _, row in df[['Asset Type', 'Asset Make', 'Asset Model']].drop_duplicates().iterrows():
            if row['Asset Type'] and row['Asset Make'] and row['Asset Model']:
                model_id = f"{row['Asset Type']}-{row['Asset Make']}-{row['Asset Model']}".replace('/', '-')
                model_doc = asset_models_ref.document(model_id)
                model_doc.set({
                    'asset_type': row['Asset Type'],
                    'asset_make': row['Asset Make'],
                    'asset_model': row['Asset Model']
                }, merge=True)

        print("Lookup collections populated successfully.")

        print("Importing main asset data...")
        assets_ref = db.collection('assets')
        imported_count = 0
        for _, row in df.iterrows():
            if pd.isna(row['Serial Number']):
                continue # Skip rows without a serial number

            # Get references to documents in lookup collections
            asset_model_id = f"{row['Asset Type']}-{row['Asset Make']}-{row['Asset Model']}".replace('/', '-')
            model_ref = db.collection('asset_models').document(asset_model_id) if row['Asset Model'] else None

            location_ref = db.collection('locations').document(row['Location'].replace('/', '-')) if row['Location'] else None
            user_ref = db.collection('users').document(row['User Allocated'].replace('/', '-')) if row['User Allocated'] else None
            asset_status_ref = db.collection('asset_statuses').document(row['Asset Status'].replace('/', '-')) if row['Asset Status'] else None

            # Use serial number as the document ID for assets to prevent duplicates
            asset_doc = assets_ref.document(row['Serial Number'])

            asset_data = {
                'asset_tag': row['Tag No'],
                'serial_number': row['Serial Number'],
                'os_version': row['OS Version'],
                'asset_model': model_ref,
                'location': location_ref,
                'user': user_ref,
                'asset_status': asset_status_ref
            }
            
            # Filter out None values before setting the document
            asset_data_cleaned = {k: v for k, v in asset_data.items() if v is not None}

            asset_doc.set(asset_data_cleaned, merge=True)
            imported_count += 1

        print(f"Successfully imported {imported_count} records into the assets collection.")

    except FileNotFoundError as e:
        print(f"Error: {e}")
    except ValueError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == '__main__':
    # Assuming the script is in backend/, and data.js is in backend/
    file_path = os.path.join(os.path.dirname(__file__), 'data.js')
    import_data_to_firestore(file_path)
