import os
import motor.motor_asyncio
from bson import ObjectId
from typing import Optional
from fastapi import HTTPException
import logging
from datetime import datetime, timedelta
from functools import lru_cache
from . import models_mongo

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
async def get_terms(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_field: str = 'term',
    sort_order: str = 'asc'
):
    query = {}
    if search:
        escaped_search = search.replace('(', '\(').replace(')', '\)')
        query['$or'] = [
            {'term': {'$regex': f'{escaped_search}', '$options': 'i'}},
            {'definition': {'$regex': f'{escaped_search}', '$options': 'i'}},
            {'category': {'$regex': f'{escaped_search}', '$options': 'i'}}
        ]
    if category and category.strip():
        query['category'] = category

    # Validate and apply sorting
    valid_fields = {
        'term': 'term',
        'category': 'category',
        'definition': 'definition',
        'created': '_id'
    }
    
    sort_field = valid_fields.get(sort_field, 'term')
    sort_order_value = 1 if sort_order == 'asc' else -1
    sort_config = [(sort_field, sort_order_value)]

    try:
        logger.info(f"Query: {query}")
        logger.info(f"Sort config: {sort_config}")
        
        cursor = db.terms.find(query).sort(sort_config).skip(skip).limit(limit)
        terms = await cursor.to_list(length=limit)
        total = await db.terms.count_documents(query)
        
        logger.info(f"Found {len(terms)} terms")
        
        return {
            'items': [fix_id(term) for term in terms],
            'total': total,
            'page': (skip // limit) + 1,
            'pages': (total + limit - 1) // limit,
            'categories': await get_categories()
        }
    except Exception as e:
        logger.error(f"Error in get_terms: {e}")
        raise

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

async def get_database_stats():
    try:
        stats = await db.command("dbStats")
        size_mb = stats["dataSize"] / (1024 * 1024)
        doc_count = stats["objects"]
        logger.info(f"Database Stats - Size: {size_mb:.2f}MB, Documents: {doc_count}")
        return {
            "size_mb": round(size_mb, 2),
            "document_count": doc_count,
            "storage_limit_mb": 512,  # Free tier limit
            "usage_percentage": round((size_mb / 512) * 100, 2)
        }
    except Exception as e:
        logger.error(f"Failed to get database stats: {e}")
        return None

# Cache for frequently accessed data
_cache = {
    "categories": {"data": None, "timestamp": None},
    "common_terms": {"data": None, "timestamp": None}
}
CACHE_DURATION = timedelta(minutes=5)

async def get_categories():
    now = datetime.now()
    cache = _cache["categories"]
    
    if cache["data"] and cache["timestamp"]:
        if now - cache["timestamp"] < CACHE_DURATION:
            return cache["data"]
    
    categories = await db.terms.distinct('category')
    _cache["categories"].update({
        "data": categories,
        "timestamp": now
    })
    return categories

async def get_suggestions(search: str, limit: int = 5):
    """Get term suggestions for autocomplete"""
    try:
        if not search.strip():
            return []

        escaped_search = search.replace('(', '\(').replace(')', '\)')
        query = {
            'term': {'$regex': f'^{escaped_search}', '$options': 'i'}  # Start with match
        }
        
        cursor = db.terms.find(query).limit(limit)
        suggestions = await cursor.to_list(length=limit)
        
        # If we don't have enough suggestions, try contains match
        if len(suggestions) < limit:
            contains_query = {
                'term': {
                    '$regex': f'{escaped_search}',
                    '$options': 'i'
                }
            }
            more_cursor = db.terms.find(contains_query).limit(limit - len(suggestions))
            more_suggestions = await more_cursor.to_list(length=limit - len(suggestions))
            suggestions.extend(more_suggestions)

        # Remove duplicates and format response
        seen = set()
        unique_suggestions = []
        for term in suggestions:
            if term['term'].lower() not in seen:
                seen.add(term['term'].lower())
                unique_suggestions.append({
                    'term': term['term'],
                    'id': str(term['_id'])
                })
        
        return unique_suggestions[:limit]
    except Exception as e:
        logger.error(f"Error in get_suggestions: {e}")
        return []

@lru_cache(maxsize=100)
async def get_term_by_id(term_id: str):
    """Cache individual term lookups"""
    term = await db.terms.find_one({'_id': ObjectId(term_id)})
    return fix_id(term) if term else None

async def bulk_create_terms(terms: list):
    """Bulk create terms with validation and duplicate checking"""
    try:
        results = {
            "processed": 0,
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for term_data in terms:
            try:
                # Validate term data
                term = models_mongo.TermCreate(
                    term=term_data['term'].strip(),  # Strip whitespace
                    definition=term_data['definition'].strip(),
                    category=term_data['category'].strip()
                )
                
                # Case-insensitive duplicate check
                existing = await db.terms.find_one({
                    'term': {'$regex': f'^{term.term}$', '$options': 'i'}
                })
                
                # Also check for full name if it's an acronym
                if '(' in term.term:
                    base_term = term.term.split('(')[0].strip()
                    existing_base = await db.terms.find_one({
                        'term': {'$regex': f'^{base_term}$', '$options': 'i'}
                    })
                    if existing_base:
                        results["failed"] += 1
                        results["errors"].append(f"Term '{term.term}' already exists as '{existing_base['term']}'")
                        continue
                
                if existing:
                    results["failed"] += 1
                    results["errors"].append(f"Term '{term.term}' already exists")
                    continue
                
                # Create term
                await db.terms.insert_one(term.model_dump())
                results["success"] += 1
                
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Error processing term '{term_data.get('term', 'unknown')}': {str(e)}")
            
            results["processed"] += 1
        
        # Log results
        logger.info(f"Bulk upload results: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Bulk creation error: {e}")
        raise

async def cleanup_duplicates():
    """Remove duplicate terms from the database"""
    try:
        # Get all terms
        terms = await db.terms.find().to_list(length=None)
        
        # Track processed terms to avoid duplicates
        processed = set()
        duplicates = []
        
        for term in terms:
            term_lower = term['term'].lower()
            
            # If we've seen this term before
            if term_lower in processed:
                duplicates.append(term['_id'])
            else:
                processed.add(term_lower)
        
        # Remove duplicates
        if duplicates:
            result = await db.terms.delete_many({'_id': {'$in': duplicates}})
            logger.info(f"Removed {result.deleted_count} duplicate terms")
            
        return len(duplicates)
        
    except Exception as e:
        logger.error(f"Error cleaning up duplicates: {e}")
        raise

async def bulk_delete_terms(term_ids: list[str]) -> int:
    """Delete multiple terms by their IDs"""
    try:
        # Convert string IDs to ObjectIds
        object_ids = [ObjectId(id) for id in term_ids]
        result = await db.terms.delete_many({'_id': {'$in': object_ids}})
        return result.deleted_count
    except Exception as e:
        logger.error(f"Bulk delete error: {e}")
        raise

async def delete_all_terms() -> int:
    """Delete all terms from the database"""
    try:
        result = await db.terms.delete_many({})
        return result.deleted_count
    except Exception as e:
        logger.error(f"Delete all error: {e}")
        raise 