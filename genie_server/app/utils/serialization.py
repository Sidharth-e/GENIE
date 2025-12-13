"""
Serialization utilities for GENIE Server.

Provides helper functions for data conversion and serialization.
"""
import json
from typing import Any, Dict, List, Union

from bson import json_util


def bson_to_json(data: Union[Dict, List]) -> Union[Dict, List]:
    """
    Convert BSON data to JSON-serializable format.
    
    Args:
        data: BSON data (dict or list of dicts).
        
    Returns:
        JSON-serializable data.
    """
    return json.loads(json_util.dumps(data))


def safe_json_dumps(data: Any) -> str:
    """
    Safely serialize data to JSON string.
    
    Args:
        data: Any data to serialize.
        
    Returns:
        JSON string representation.
    """
    try:
        return json.dumps(data, default=str)
    except Exception:
        return str(data)
