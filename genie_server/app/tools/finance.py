"""
Finance tools for GENIE Server.

Contains tools for financial data retrieval.
"""
import datetime
from typing import Literal

from app import mcp


@mcp.tool()
def get_stock_price(ticker: str, market: Literal["US", "EU", "ASIA"]) -> str:
    """
    Retrieves the current simulated stock price for a given ticker.
    
    Args:
        ticker: The stock symbol (e.g., AAPL, NVDA).
        market: The region of the market.
        
    Returns:
        str: Formatted stock price with timestamp.
    """
    # In a real app, you would fetch from an API here.
    # We will simulate data based on the ticker name length.
    base_price = len(ticker) * 50.25
    
    current_time = datetime.datetime.now().strftime("%H:%M:%S")
    
    return f"[{current_time}] {ticker.upper()} ({market}): ${base_price:.2f}"
