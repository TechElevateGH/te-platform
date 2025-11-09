from typing import Generator

from app.core.settings import settings
from pymongo import MongoClient
from pymongo.database import Database

# MongoDB client
client = MongoClient(settings.MONGODB_URI)
mongodb = client[settings.MONGODB_DB_NAME]


def get_db() -> Generator[Database, None, None]:
    """
    Dependency for getting MongoDB database instance.
    """
    try:
        yield mongodb
    finally:
        pass  # Connection pooling handled by MongoClient
