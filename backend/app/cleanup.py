from .database import SessionLocal
from .models import Term

def cleanup_test_terms():
    db = SessionLocal()
    try:
        # Delete any terms that start or end with underscore
        test_terms = db.query(Term).filter(
            (Term.term.startswith('_')) | (Term.term.endswith('_'))
        ).all()
        
        for term in test_terms:
            db.delete(term)
        
        db.commit()
        print(f"Cleaned up {len(test_terms)} test terms")
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close() 