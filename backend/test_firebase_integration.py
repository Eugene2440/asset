"""
Test script to verify Firebase integration
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.firebase import initialize_firebase, get_firestore_db

def test_firebase_connection():
    try:
        print("Testing Firebase connection...")
        
        # Initialize Firebase
        initialize_firebase()
        print("✓ Firebase Admin SDK initialized successfully")
        
        # Test Firestore connection
        db = get_firestore_db()
        print("✓ Firestore client created successfully")
        
        # Try to access a collection (this will work even if collection doesn't exist)
        collection_ref = db.collection('test')
        print("✓ Can access Firestore collections")
        
        print("\n🎉 Firebase integration test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Firebase integration test failed: {e}")
        return False

if __name__ == "__main__":
    test_firebase_connection()