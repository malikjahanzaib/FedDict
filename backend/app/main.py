from fastapi import FastAPI, HTTPException, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
from . import database, models_mongo, initial_data
from .auth import get_admin_credentials
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FedDict API")

@app.on_event("startup")
async def startup_event():
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

@app.get("/")
async def read_root():
    return {
        "message": "FedDict API is running",
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
    skip = (page - 1) * per_page
    return await database.get_terms(skip, per_page, search, category)

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