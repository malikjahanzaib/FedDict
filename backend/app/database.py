import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# For local development
SQLALCHEMY_DATABASE_URL = "sqlite:///./feddict.db"

# For production on Render
if os.getenv("RENDER"):
    SQLALCHEMY_DATABASE_URL = "sqlite:////opt/render/project/src/feddict.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 