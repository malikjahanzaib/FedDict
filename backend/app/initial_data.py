from .database import SessionLocal
from .models import Term

initial_terms = [
    {
        "term": "RFP",
        "definition": "Request for Proposal - A document that announces and details a project, as well as solicits bids from contractors who will help complete the project.",
        "category": "Procurement"
    },
    {
        "term": "FAR",
        "definition": "Federal Acquisition Regulation - The principal set of rules regarding government procurement in the United States.",
        "category": "Regulations"
    },
    {
        "term": "IDIQ",
        "definition": "Indefinite Delivery/Indefinite Quantity - A type of contract that provides for an indefinite quantity of supplies or services during a fixed period.",
        "category": "Contracts"
    },
    {
        "term": "SOW",
        "definition": "Statement of Work - A document that defines project-specific activities, deliverables, and timelines for a contractor providing services.",
        "category": "Documentation"
    }
]

def init_db():
    db = SessionLocal()
    try:
        # Check if we already have terms
        existing_count = db.query(Term).count()
        if existing_count == 0:
            for term_data in initial_terms:
                term = Term(**term_data)
                db.add(term)
            db.commit()
            print("Initial data loaded successfully")
        else:
            print("Database already contains data")
    except Exception as e:
        print(f"Error loading initial data: {e}")
        db.rollback()
    finally:
        db.close() 