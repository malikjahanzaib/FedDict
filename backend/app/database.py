import os
import motor.motor_asyncio
from bson import ObjectId
from typing import Optional
from fastapi import HTTPException
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Get MongoDB URL from environment variable
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError(
        "No MongoDB URL found. "
        "Make sure MONGODB_URL environment variable is set"
    )

# Create Motor client with connection pooling and timeouts
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000
)

db = client.feddict  # Add this line to define the database

# Verify database connection on startup
async def verify_database():
    try:
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise

# Helper function to convert MongoDB _id to string
def fix_id(obj):
    if isinstance(obj, dict) and '_id' in obj:
        obj['id'] = str(obj['_id'])
        del obj['_id']
    return obj

# Database operations
async def get_terms(skip: int = 0, limit: int = 10, search: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if search:
        query['$or'] = [
            {'term': {'$regex': search, '$options': 'i'}},
            {'definition': {'$regex': search, '$options': 'i'}}
        ]
    if category:
        query['category'] = category

    cursor = db.terms.find(query).skip(skip).limit(limit)
    terms = await cursor.to_list(length=limit)
    total = await db.terms.count_documents(query)
    
    return {
        'items': [fix_id(term) for term in terms],
        'total': total,
        'page': (skip // limit) + 1,
        'pages': (total + limit - 1) // limit
    }

async def create_term(term_data: dict):
    # Check if term already exists (case-insensitive)
    existing = await db.terms.find_one({
        'term': {'$regex': f'^{term_data["term"]}$', '$options': 'i'}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Term already exists")
    
    result = await db.terms.insert_one(term_data)
    created_term = await db.terms.find_one({'_id': result.inserted_id})
    return fix_id(created_term)

async def get_term(term_id: str):
    term = await db.terms.find_one({'_id': ObjectId(term_id)})
    return fix_id(term) if term else None

async def update_term(term_id: str, term_data: dict):
    await db.terms.update_one(
        {'_id': ObjectId(term_id)},
        {'$set': term_data}
    )
    updated_term = await db.terms.find_one({'_id': ObjectId(term_id)})
    return fix_id(updated_term)

async def delete_term(term_id: str):
    result = await db.terms.delete_one({'_id': ObjectId(term_id)})
    return result.deleted_count > 0

async def get_categories():
    return await db.terms.distinct('category')

async def get_suggestions(search: str, limit: int = 5):
    query = {
        'term': {'$regex': f'^{search}', '$options': 'i'}
    }
    cursor = db.terms.find(query).limit(limit)
    suggestions = await cursor.to_list(length=limit)
    return [term['term'] for term in suggestions] 