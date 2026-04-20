import os
from dotenv import load_dotenv
load_dotenv()
from pymongo import MongoClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def setup_database():
    # To run this script, set the MONGO_URI environment variable:
    # Windows: set MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/test"
    # Linux/Mac: export MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/test"
    
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    print(f"Connecting to MongoDB at: {mongo_uri}")
    
    try:
        client = MongoClient(mongo_uri)
        # Test connection
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        
        db = client["parkinson_db"]
        
        # Explicitly create collections (not strictly necessary in MongoDB, but requested)
        collections = db.list_collection_names()
        if "patients" not in collections:
            db.create_collection("patients")
            print("Created 'patients' collection.")
        if "doctors" not in collections:
            db.create_collection("doctors")
            print("Created 'doctors' collection.")
        if "tests" not in collections:
            db.create_collection("tests")
            print("Created 'tests' collection.")
            
        # Add a sample doctor document
        doctors_col = db["doctors"]
        doctor_email = "doctor@example.com"
        
        if not doctors_col.find_one({"email": doctor_email}):
            hashed_password = pwd_context.hash("DoctorPass@123")
            doctor_doc = {
                "id": "doc_001",
                "name": "Dr. Smith",
                "email": doctor_email,
                "password": hashed_password,
                "role": "doctor"
            }
            doctors_col.insert_one(doctor_doc)
            print(f"Sample doctor created: Email: {doctor_email}, Password: DoctorPass@123")
        else:
            print("Sample doctor already exists.")
            
        print("Database setup complete.")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    setup_database()
