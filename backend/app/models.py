from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint
from sqlalchemy.sql import func
from .database import Base

class Term(Base):
    __tablename__ = "terms"

    id = Column(Integer, primary_key=True, index=True)
    term = Column(String, unique=True, index=True)
    definition = Column(Text)
    category = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add constraint to prevent terms starting or ending with underscore
    __table_args__ = (
        CheckConstraint(
            "term NOT LIKE '\_%' AND term NOT LIKE '%\_'",
            name='prevent_test_terms'
        ),
    ) 