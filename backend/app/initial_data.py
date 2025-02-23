from . import database
import logging

logger = logging.getLogger(__name__)

initial_terms = [
    {
        "term": "BAFO",
        "definition": "Best and Final Offer",
        "category": "Contracting"
    },
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

async def init_db():
    try:
        # Check if we already have terms
        existing = await database.get_terms(0, 1)
        if existing['total'] == 0:
            logger.info("Initializing database with default terms")
            for term_data in initial_terms:
                await database.create_term(term_data)
            logger.info("Initial data loaded successfully")
        else:
            logger.info("Database already contains data, skipping initialization")
    except Exception as e:
        logger.error(f"Error loading initial data: {e}") 