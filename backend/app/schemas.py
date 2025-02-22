from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TermBase(BaseModel):
    term: str
    definition: str
    category: str

class TermCreate(TermBase):
    pass

class Term(TermBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True 