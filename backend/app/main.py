from fastapi import FastAPI, Depends, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database
from .database import engine
from fastapi.responses import JSONResponse
from . import initial_data
from .auth import get_admin_credentials
from . import cleanup  # Add this import at the top
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

def is_database_initialized(db_engine):
    try:
        with db_engine.connect() as connection:
            result = connection.execute(
                text("SELECT COUNT(*) FROM term WHERE term NOT LIKE '_%' AND term NOT LIKE '%_'")
            )
            count = result.scalar() > 0
            logger.info(f"Database initialization check: found {count} non-test terms")
            return count
    except Exception as e:
        logger.error(f"Database check failed: {e}")
        return False

# Only initialize if database is completely empty or only has test terms
if not is_database_initialized(engine):
    logger.info("Initializing database with default terms")
    cleanup.cleanup_test_terms()
    initial_data.init_db()
else:
    logger.info("Database already initialized, skipping initialization")

app = FastAPI(title="FedDict API")

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
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/")
def read_root():
    return JSONResponse({
        "message": "FedDict API is running",
        "endpoints": {
            "terms": "/terms/",
            "categories": "/categories/",
            "search": "/terms/?search=your_search_term",
            "filter": "/terms/?category=your_category"
        }
    })

@app.get("/terms/", response_model=schemas.PaginatedTermResponse)
@limiter.limit("100/minute")
async def get_terms(
    request: Request,
    search: str = None,
    category: str = None,
    page: int = Query(1, gt=0),
    per_page: int = Query(10, gt=0, le=100),
    db: Session = Depends(database.get_db)
):
    skip = (page - 1) * per_page
    query = db.query(models.Term)
    
    if search:
        search = f"%{search}%"
        query = query.filter(models.Term.term.ilike(search) | 
                           models.Term.definition.ilike(search))
    
    if category:
        query = query.filter(models.Term.category == category)
    
    total = query.count()
    total_pages = (total + per_page - 1) // per_page
    
    terms = query.offset(skip).limit(per_page).all()
    
    return {
        "items": terms,
        "total": total,
        "page": page,
        "pages": total_pages
    }

@app.post("/terms/", response_model=schemas.Term)
def create_term(
    term: schemas.TermCreate,
    db: Session = Depends(database.get_db),
    username: str = Depends(get_admin_credentials)
):
    # Prevent test terms from being created
    if term.term.startswith('_') or term.term.endswith('_'):
        raise HTTPException(status_code=400, detail="Invalid term format")
    
    db_term = models.Term(**term.dict())
    try:
        db.add(db_term)
        db.commit()
        db.refresh(db_term)
        return db_term
    except:
        db.rollback()
        raise HTTPException(status_code=400, detail="Term already exists")

@app.get("/terms/{term_id}", response_model=schemas.Term)
def get_term(term_id: int, db: Session = Depends(database.get_db)):
    term = db.query(models.Term).filter(models.Term.id == term_id).first()
    if term is None:
        raise HTTPException(status_code=404, detail="Term not found")
    return term

@app.put("/terms/{term_id}", response_model=schemas.Term)
def update_term(
    term_id: int,
    term_update: schemas.TermCreate,
    db: Session = Depends(database.get_db),
    username: str = Depends(get_admin_credentials)
):
    term = db.query(models.Term).filter(models.Term.id == term_id).first()
    if term is None:
        raise HTTPException(status_code=404, detail="Term not found")
    
    for key, value in term_update.dict().items():
        setattr(term, key, value)
    
    db.commit()
    db.refresh(term)
    return term

@app.delete("/terms/{term_id}")
def delete_term(
    term_id: int,
    db: Session = Depends(database.get_db),
    username: str = Depends(get_admin_credentials)
):
    term = db.query(models.Term).filter(models.Term.id == term_id).first()
    if term is None:
        raise HTTPException(status_code=404, detail="Term not found")
    
    db.delete(term)
    db.commit()
    return {"message": "Term deleted successfully"}

@app.get("/categories/")
def get_categories(db: Session = Depends(database.get_db)):
    categories = db.query(models.Term.category).distinct().all()
    return [category[0] for category in categories]

@app.get("/verify-auth/")
def verify_auth(username: str = Depends(get_admin_credentials)):
    return {"status": "authenticated", "username": username}

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

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "status_code": 500,
            "type": "error"
        }
    ) 