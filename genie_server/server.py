
from mcp.server.fastmcp import FastMCP
import datetime
from typing import Literal, Dict, Any, List, Optional
import pymongo
from bson import json_util
import json

# Initialize the server
# This automatically handles the SSE (Server-Sent Events) endpoint at /sse
mcp = FastMCP("Streamable-Tools-Server")

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017/"
mongo_client = pymongo.MongoClient(MONGO_URI)

# --- Tool 4: MongoDB Data ---
@mcp.tool()
def get_userData(query: Dict[str, Any] = {}, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Retrieves documents from a local MongoDB database.
    Args:
        query: MongoDB query filter (as a dictionary). Defaults to empty (find all).
        limit: Maximum number of documents to return. Defaults to 10.
    """
    try:
        db = mongo_client["fitbit"]
        col = db["users"]
        cursor = col.find(query).limit(limit)
        
        # specific bson conversion to make it JSON serializable for MCP
        results = []
        for doc in cursor:
             results.append(json.loads(json_util.dumps(doc)))
             
        return results
    except Exception as e:
        return [{"error": str(e)}]

# --- Tool 1: Simple Math (Utility) ---
@mcp.tool()
def calculate_metrics(visits: int, conversions: int) -> str:
    """
    Calculate the conversion rate percentage based on visits and conversions.
    """
    if visits == 0:
        return "Error: Visits cannot be zero."
    
    rate = (conversions / visits) * 100
    return f"Conversion Rate: {rate:.2f}%"

# --- Tool 2: Text Processing (Data Manipulation) ---
@mcp.tool()
def analyze_sentiment_keyword(text: str) -> dict:
    """
    Analyzes a string to find the most 'positive' sounding keyword (Simulated).
    Returns a JSON-like dictionary.server
    """
    # Simple logic for demonstration
    positive_words = ["good", "great", "excellent", "amazing", "success", "profit"]
    found_words = [word for word in text.split() if word.lower() in positive_words]
    
    return {
        "text_length": len(text),
        "positive_keywords_found": found_words,
        "score": len(found_words) * 10
    }

# --- Tool 3: System/External Data (Simulation) ---
@mcp.tool()
def get_stock_price(ticker: str, market: Literal["US", "EU", "ASIA"]) -> str:
    """
    Retrieves the current simulated stock price for a given ticker.
    Args:
        ticker: The stock symbol (e.g., AAPL, NVDA)
        market: The region of the market.
    """
    # In a real app, you would fetch from an API here.
    # We will simulate data based on the ticker name length.
    base_price = len(ticker) * 50.25
    
    current_time = datetime.datetime.now().strftime("%H:%M:%S")
    
    return f"[{current_time}] {ticker.upper()} ({market}): ${base_price:.2f}"

# If running directly (optional, but good for testing)
if __name__ == "__main__":
    mcp.run(transport="streamable-http")