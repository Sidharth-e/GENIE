"""
MongoDB connection and utility functions.

Provides a singleton MongoDB client and helper functions for database access.
"""
import logging
from typing import Optional

import pymongo
from pymongo.database import Database
from pymongo.collection import Collection

from app.config import settings

logger = logging.getLogger(__name__)

# MongoDB client singleton
_mongo_client: Optional[pymongo.MongoClient] = None


def get_mongo_client() -> pymongo.MongoClient:
    """
    Get or create the MongoDB client singleton.
    
    Returns:
        pymongo.MongoClient: The MongoDB client instance.
    """
    global _mongo_client
    
    if _mongo_client is None:
        try:
            _mongo_client = pymongo.MongoClient(settings.MONGO_URI)
            logger.info(f"Connected to MongoDB at {settings.MONGO_URI}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    return _mongo_client


# Convenience alias
mongo_client = get_mongo_client()


def get_database(db_name: Optional[str] = None) -> Database:
    """
    Get a database instance.
    
    Args:
        db_name: Database name. Defaults to MONGO_DEFAULT_DB from settings.
        
    Returns:
        Database: The MongoDB database instance.
    """
    client = get_mongo_client()
    return client[db_name or settings.MONGO_DEFAULT_DB]


def get_collection(collection_name: str, db_name: Optional[str] = None) -> Collection:
    """
    Get a collection instance.
    
    Args:
        collection_name: Name of the collection.
        db_name: Database name. Defaults to MONGO_DEFAULT_DB from settings.
        
    Returns:
        Collection: The MongoDB collection instance.
    """
    db = get_database(db_name)
    return db[collection_name]
