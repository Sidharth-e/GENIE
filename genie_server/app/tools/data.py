"""
Data tools for GENIE Server.

Contains tools for database data retrieval.
"""
import json
import logging
from typing import Any, Dict, List

from bson import json_util

from app import mcp
from app.database import get_collection

logger = logging.getLogger(__name__)


@mcp.tool()
def get_userData(query: Dict[str, Any] = {}, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Retrieves documents from a local MongoDB database.
    
    Args:
        query: MongoDB query filter (as a dictionary). Defaults to empty (find all).
        limit: Maximum number of documents to return. Defaults to 10.
        
    Returns:
        List[Dict]: List of documents matching the query.
    """
    try:
        collection = get_collection("users")
        cursor = collection.find(query).limit(limit)
        
        # BSON conversion to make it JSON serializable for MCP
        results = []
        for doc in cursor:
            results.append(json.loads(json_util.dumps(doc)))
        
        return results
    except Exception as e:
        logger.error(f"Error retrieving user data: {e}")
        return [{"error": str(e)}]
