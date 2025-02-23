from . import database
from .models import Term

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
    for term_data in initial_terms:
        await database.create_term(term_data) 