import os
import sys
from dotenv import load_dotenv
import motor.motor_asyncio
import asyncio

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
print(f"Looking for .env at: {env_path}")
print(f"File exists: {os.path.exists(env_path)}")

if os.path.exists(env_path):
    load_dotenv(env_path)

# Get MongoDB URL
mongodb_url = os.getenv("MONGODB_URL")
print(f"MONGODB_URL: {mongodb_url and mongodb_url[:20]}...")

if not mongodb_url:
    print("ERROR: MONGODB_URL environment variable not set")
    sys.exit(1)

# Test connection
async def test_connection():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(
            mongodb_url,
            serverSelectionTimeoutMS=5000
        )
        
        # Test the connection
        await client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        # List databases
        db_list = await client.list_database_names()
        print(f"Available databases: {db_list}")
        
        # Create a test document
        db = client.feddict
        result = await db.test_collection.insert_one({"test": "document"})
        print(f"Inserted document with ID: {result.inserted_id}")
        
        # Retrieve the document
        doc = await db.test_collection.find_one({"test": "document"})
        print(f"Retrieved document: {doc}")
        
        # Clean up
        await db.test_collection.delete_one({"test": "document"})
        print("Test document deleted")
        
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

# Run the test
asyncio.run(test_connection()) 