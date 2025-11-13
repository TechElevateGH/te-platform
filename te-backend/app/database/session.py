from typing import Generator

from app.core.settings import settings
from pymongo import MongoClient
from pymongo.database import Database
import certifi

# MongoDB client with SSL certificate
client = MongoClient(
    settings.MONGODB_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
)
mongodb = client[settings.MONGODB_DB_NAME]


def get_db() -> Generator[Database, None, None]:
    """
    Dependency for getting MongoDB database instance.
    """
    try:
        yield mongodb
    finally:
        pass  # Connection pooling handled by MongoClient
