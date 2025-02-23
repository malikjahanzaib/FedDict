from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database
from .database import engine
from fastapi.responses import JSONResponse
from . import initial_data
from .auth import get_admin_credentials
from . import cleanup  # Add this import at the top

models.Base.metadata.create_all(bind=engine)

# Add this after models.Base.metadata.create_all(bind=engine)
cleanup.cleanup_test_terms()

initial_data.init_db()

app = FastAPI(title="FedDict API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://feddict.vercel.app",  # Your Vercel deployment URL
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Specify allowed methods
    allow_headers=["*"],  # You can specify headers if needed
)

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

@app.get("/terms/", response_model=List[schemas.Term])
def get_terms(
    search: str = None,
    category: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Term)
    
    if search:
        search = f"%{search}%"
        query = query.filter(models.Term.term.ilike(search) | 
                           models.Term.definition.ilike(search))
    
    if category:
        query = query.filter(models.Term.category == category)
    
    return query.offset(skip).limit(limit).all()

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