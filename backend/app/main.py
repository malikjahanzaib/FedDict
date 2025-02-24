from fastapi import FastAPI, HTTPException, Request, status, Depends, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
from . import database, models_mongo, initial_data
from .auth import get_admin_credentials
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
import time
import asyncio
from datetime import datetime
import csv
import json
from io import StringIO
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FedDict API")

# Track last activity
last_activity = datetime.now()

# Warm-up tasks
async def warm_up_tasks():
    """Perform initialization tasks"""
    try:
        # Verify database connection
        await database.verify_database()
        # Pre-fetch categories for cache
        await database.get_categories()
        # Log warm-up success
        logger.info("Warm-up tasks completed successfully")
    except Exception as e:
        logger.error(f"Warm-up failed: {e}")

@app.on_event("startup")
async def startup_event():
    await database.verify_database()
    await initial_data.init_db()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://feddict.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.middleware("http")
async def middleware_handler(request: Request, call_next):
    # Track activity for cold start handling
    global last_activity
    last_activity = datetime.now()
    
    # Monitor request timing
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Log slow requests (over 1 second)
    if process_time > 1:
        logger.warning(f"Slow request: {request.url.path} took {process_time:.2f}s")
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/")
async def read_root(background_tasks: BackgroundTasks):
    """Root endpoint with warm-up"""
    # Calculate time since last activity
    idle_time = (datetime.now() - last_activity).total_seconds()
    
    # If server was idle, trigger warm-up
    if idle_time > 840:  # 14 minutes
        background_tasks.add_task(warm_up_tasks)
        logger.info("Triggered warm-up after inactivity")
    
    return {
        "message": "FedDict API is running",
        "status": "warming_up" if idle_time > 840 else "ready",
        "endpoints": {
            "terms": "/terms/",
            "categories": "/categories/",
            "search": "/terms/?search=your_search_term",
            "filter": "/terms/?category=your_category"
        }
    }

@app.get("/terms/")
async def get_terms(
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    per_page: int = 10
):
    """Get terms with optional search and category filters"""
    try:
        skip = (page - 1) * per_page
        return await database.get_terms(skip, per_page, search, category)
    except Exception as e:
        logger.error(f"Error in get_terms endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch terms"
        )

@app.post("/terms/")
@limiter.limit("10/minute")
async def create_term(
    request: Request,
    term: models_mongo.TermCreate,
    username: str = Depends(get_admin_credentials)
):
    return await database.create_term(term.dict())

@app.get("/terms/{term_id}", response_model=models_mongo.Term)
async def get_term(term_id: str):
    term = await database.get_term(term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
    return term

@app.put("/terms/{term_id}", response_model=models_mongo.Term)
async def update_term(
    term_id: str,
    term: models_mongo.TermCreate,
    username: str = Depends(get_admin_credentials)
):
    updated_term = await database.update_term(term_id, term.dict())
    if not updated_term:
        raise HTTPException(status_code=404, detail="Term not found")
    return updated_term

@app.delete("/terms/{term_id}")
async def delete_term(term_id: str, username: str = Depends(get_admin_credentials)):
    success = await database.delete_term(term_id)
    if not success:
        raise HTTPException(status_code=404, detail="Term not found")
    return {"message": "Term deleted successfully"}

@app.get("/categories/")
async def get_categories():
    return await database.get_categories()

@app.get("/verify-auth/")
async def verify_auth(username: str = Depends(get_admin_credentials)):
    return {"status": "authenticated", "username": username}

@app.get("/admin/stats")
async def get_stats(username: str = Depends(get_admin_credentials)):
    """Get database and API statistics"""
    stats = await database.get_database_stats()
    if not stats:
        raise HTTPException(status_code=500, detail="Failed to get database stats")
    return stats

@app.post("/admin/upload")
async def upload_terms(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    username: str = Depends(get_admin_credentials)
):
    """Upload multiple terms via CSV or JSON file"""
    logger.info(f"Received file upload: {file.filename}")
    
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    if not file.filename.endswith(('.csv', '.json')):
        raise HTTPException(
            status_code=400,
            detail="Only CSV and JSON files are supported"
        )
    
    try:
        content = await file.read()
        content_str = content.decode()
        logger.info(f"File contents length: {len(content_str)}")
        
        terms = []
        if file.filename.endswith('.csv'):
            csv_file = StringIO(content_str)
            reader = csv.DictReader(csv_file)
            terms = [row for row in reader]
            logger.info(f"Parsed CSV rows: {len(terms)}")
        else:  # JSON file
            terms = json.loads(content_str)
            logger.info(f"Parsed JSON entries: {len(terms)}")
            
        if not terms:
            raise HTTPException(
                status_code=400,
                detail="File contains no valid terms"
            )

        # Process terms immediately instead of background
        results = await database.bulk_create_terms(terms)
        
        return {
            "message": f"Processed {len(terms)} terms",
            "status": "completed",
            "results": results
        }
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except csv.Error as e:
        logger.error(f"CSV parse error: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV format: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )

@app.post("/admin/cleanup-duplicates")
async def cleanup_duplicates(username: str = Depends(get_admin_credentials)):
    """Remove duplicate terms from the database"""
    count = await database.cleanup_duplicates()
    return {
        "message": f"Removed {count} duplicate terms",
        "status": "completed"
    }

class BulkDeleteRequest(BaseModel):
    term_ids: list[str]

@app.post("/admin/bulk-delete")
async def bulk_delete_terms(
    request: BulkDeleteRequest,
    username: str = Depends(get_admin_credentials)
):
    """Delete multiple terms by their IDs with confirmation"""
    try:
        # Get the terms to show what will be deleted
        terms = []
        for term_id in request.term_ids:
            term = await database.get_term(term_id)
            if term:
                terms.append(term)
        
        # Delete the terms
        deleted = await database.bulk_delete_terms(request.term_ids)
        
        return {
            "message": f"Successfully deleted {deleted} terms",
            "deleted_terms": terms
        }
    except Exception as e:
        logger.error(f"Bulk delete error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete terms: {str(e)}"
        )

@app.delete("/admin/delete-all")
async def delete_all_terms(
    confirmation: str,
    username: str = Depends(get_admin_credentials)
):
    """Delete all terms from the database with strict confirmation"""
    if confirmation != f"CONFIRM_DELETE_ALL_{datetime.now().strftime('%Y%m%d')}":
        raise HTTPException(
            status_code=400,
            detail="Invalid confirmation code. Use CONFIRM_DELETE_ALL_YYYYMMDD"
        )
    
    try:
        count = await database.delete_all_terms()
        return {
            "message": f"Successfully deleted all {count} terms",
            "deleted_count": count
        }
    except Exception as e:
        logger.error(f"Delete all error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete all terms: {str(e)}"
        )

@app.post("/admin/verify")
async def verify_credentials(username: str = Depends(get_admin_credentials)):
    """Verify admin credentials without performing any action"""
    return {"status": "valid"}

@app.get("/terms/suggestions")
async def get_term_suggestions(search: str):
    """Get term suggestions for autocomplete"""
    return await database.get_suggestions(search)

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
            "type": "error"
        }
    ) 