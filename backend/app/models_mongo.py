from typing import Optional
from pydantic import BaseModel, Field

class TermBase(BaseModel):
    term: str = Field(..., min_length=1, max_length=100)
    definition: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2)

    class Config:
        json_schema_extra = {
            "example": {
                "term": "BAFO",
                "definition": "Best and Final Offer - The final proposal submitted by a vendor...",
                "category": "Contracting"
            }
        }

class TermCreate(TermBase):
    pass

class Term(TermBase):
    id: str

    class Config:
        from_attributes = True 