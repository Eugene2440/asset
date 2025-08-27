import os
from dotenv import load_dotenv
from firebase_admin import firestore
from app.core.firebase import initialize_firebase

load_dotenv()

def remove_fields_from_locations():
    try:
        initialize_firebase()
        db = firestore.client()

        locations_ref = db.collection('locations')
        docs = locations_ref.stream()

        for doc in docs:
            doc_ref = locations_ref.document(doc.id)
            update_data = {}
            if 'address' in doc.to_dict():
                update_data['address'] = firestore.DELETE_FIELD
            if 'description' in doc.to_dict():
                update_data['description'] = firestore.DELETE_FIELD
            
            if update_data:
                doc_ref.update(update_data)
                print(f"Removed fields from document: {doc.id}")
            else:
                print(f"No fields to remove from document: {doc.id}")

        print("Finished processing all location documents.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    remove_fields_from_locations()
