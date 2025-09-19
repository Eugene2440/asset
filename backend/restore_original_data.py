import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

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

def restore_original_data_structure():
    """
    Remove all location_id fields that were incorrectly added to users
    This will restore the original data structure where users don't have location assignments
    """
    try:
        initialize_firebase()
        db = get_firestore_db()

        print("=== RESTORING ORIGINAL DATA STRUCTURE ===")
        print("This will remove all location_id fields from users collection")
        print("Press Ctrl+C to cancel if you don't want to proceed")
        
        # First, show what will be affected
        users_ref = db.collection('users')
        users_with_location = users_ref.where('location_id', '!=', None).stream()
        
        affected_users = []
        for user in users_with_location:
            user_data = user.to_dict()
            affected_users.append({
                'id': user.id,
                'name': user_data.get('name'),
                'location_id': user_data.get('location_id')
            })
        
        print(f"\nFound {len(affected_users)} users with location_id that will be removed:")
        for user in affected_users[:10]:  # Show first 10 as sample
            print(f"  - {user['name']}: {user['location_id']}")
        
        if len(affected_users) > 10:
            print(f"  ... and {len(affected_users) - 10} more users")
        
        if not affected_users:
            print("No users found with location_id field. Data might already be clean.")
            return
        
        # Ask for confirmation before proceeding
        confirmation = input(f"\nDo you want to remove location_id from {len(affected_users)} users? (yes/no): ")
        
        if confirmation.lower() != 'yes':
            print("Operation cancelled.")
            return
        
        print("\nRemoving location_id fields...")
        
        # Remove location_id from all affected users
        removed_count = 0
        for user_info in affected_users:
            try:
                user_ref = users_ref.document(user_info['id'])
                # Remove the location_id field
                user_ref.update({
                    "location_id": firestore.DELETE_FIELD
                })
                removed_count += 1
                print(f"Removed location_id from: {user_info['name']}")
            except Exception as e:
                print(f"Error removing location_id from {user_info['name']}: {e}")
        
        print(f"\n=== RESTORATION COMPLETE ===")
        print(f"Successfully removed location_id from {removed_count} users")
        print("Users collection has been restored to original structure (no location assignments)")

    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    print("WARNING: This script will remove location_id fields from users.")
    print("Make sure you want to restore the original data structure before running.")
    print()
    restore_original_data_structure()