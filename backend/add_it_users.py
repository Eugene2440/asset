import os
import firebase_admin
from firebase_admin import credentials, firestore
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

def create_it_users():
    try:
        initialize_firebase()
        db = get_firestore_db()
        it_users_ref = db.collection('it_users')

        # Hash passwords
        hashed_password_123 = pwd_context.hash("password123")
        hashed_password = pwd_context.hash("password")

        # Admin User
        admin_email = "admin@gmail.com"
        admin_doc = it_users_ref.document(admin_email)
        admin_doc.set({
            'name': 'Eugine Baraka',
            'email': admin_email,
            'role': 'admin',
            'password': hashed_password_123
        }, merge=True)
        print(f"Successfully created or updated admin user: {admin_email}")

        # New Asset Admin User
        asset_admin_email = "assetadmin@gmail.com"
        asset_admin_doc = it_users_ref.document(asset_admin_email)
        asset_admin_doc.set({
            'name': 'Asset Admin',
            'email': asset_admin_email,
            'role': 'admin',
            'password': hashed_password,
            'is_active': True,
            'created_at': firestore.SERVER_TIMESTAMP
        }, merge=True)
        print(f"Successfully created or updated asset admin user: {asset_admin_email}")

        # Regular IT User
        regular_user_email = "user@gmail.com"
        regular_user_doc = it_users_ref.document(regular_user_email)
        regular_user_doc.set({
            'name': 'Morine Mainaa',
            'email': regular_user_email,
            'role': 'regular',
            'password': hashed_password_123
        }, merge=True)
        print(f"Successfully created or updated regular IT user: {regular_user_email}")

        # New Regular User
        new_regular_email = "regular@gmail.com"
        new_regular_doc = it_users_ref.document(new_regular_email)
        new_regular_doc.set({
            'name': 'Regular User',
            'email': new_regular_email,
            'role': 'regular',
            'password': hashed_password,
            'is_active': True,
            'created_at': firestore.SERVER_TIMESTAMP
        }, merge=True)
        print(f"Successfully created or updated regular user: {new_regular_email}")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == '__main__':
    create_it_users()
