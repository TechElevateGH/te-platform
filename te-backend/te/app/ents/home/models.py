from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
)

from app.database.base_class import Base


class Team(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    image = Column(String, nullable=True)
    name = Column(String, index=True, nullable=False)
    school = Column(String, nullable=False)
    note = Column(String, nullable=False)
    linkedin = Column(String, index=True, nullable=True)
    github = Column(String, index=True, nullable=True)
    is_active = Column(Boolean, default=True)


class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    id = Column(Integer, primary_key=True, index=True)
    image = Column(String, nullable=True)
    name = Column(String, index=True, nullable=False)
    school = Column(String, nullable=False)
    note = Column(String, nullable=False)
    linkedin = Column(String, index=True, nullable=True)
    github = Column(String, index=True, nullable=True)
    is_active = Column(Boolean, default=True)


class Partner(Base):
    __tablename__ = "partners"
    id = Column(Integer, primary_key=True, index=True)
    image = Column(String, nullable=True)
    name = Column(String, index=True, nullable=False)
