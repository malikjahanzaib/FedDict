from typing import Optional
from pydantic import BaseModel, Field, field_validator

class TermBase(BaseModel):
    term: str = Field(..., min_length=1, max_length=100)
    definition: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2)

    @field_validator('term')
    def validate_term(cls, v):
        if not v.strip():
            raise ValueError('Term cannot be empty')
        return v.strip()

    @field_validator('definition')
    def validate_definition(cls, v):
        if not v.strip():
            raise ValueError('Definition cannot be empty')
        return v.strip()

    @field_validator('category')
    def validate_category(cls, v):
        if not v.strip():
            raise ValueError('Category cannot be empty')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "term": "BAFO",
                "definition": "Best and Final Offer - The final proposal submitted by a vendor",
                "category": "Contracting"
            }
        }

class TermCreate(TermBase):
    pass

class Term(TermBase):
    id: str

    class Config:
        from_attributes = True 