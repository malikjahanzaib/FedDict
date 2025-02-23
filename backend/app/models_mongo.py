from typing import Optional
from pydantic import BaseModel

class TermBase(BaseModel):
    term: str
    definition: str
    category: str

class TermCreate(TermBase):
    pass

class Term(TermBase):
    id: str

    class Config:
        from_attributes = True 