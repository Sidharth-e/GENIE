"""Database package for GENIE Server."""
from app.database.mongodb import get_database, get_collection, mongo_client

__all__ = ["get_database", "get_collection", "mongo_client"]
