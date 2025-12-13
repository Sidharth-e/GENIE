"""
Analytics tools for GENIE Server.

Contains tools for metrics calculation and text analysis.
"""
from app import mcp


@mcp.tool()
def calculate_metrics(visits: int, conversions: int) -> str:
    """
    Calculate the conversion rate percentage based on visits and conversions.
    
    Args:
        visits: Total number of visits.
        conversions: Number of conversions.
        
    Returns:
        str: Formatted conversion rate or error message.
    """
    if visits == 0:
        return "Error: Visits cannot be zero."
    
    rate = (conversions / visits) * 100
    return f"Conversion Rate: {rate:.2f}%"


@mcp.tool()
def analyze_sentiment_keyword(text: str) -> dict:
    """
    Analyzes a string to find the most 'positive' sounding keyword (Simulated).
    
    Args:
        text: The text to analyze.
        
    Returns:
        dict: Analysis results with text_length, positive_keywords_found, and score.
    """
    positive_words = ["good", "great", "excellent", "amazing", "success", "profit"]
    found_words = [word for word in text.split() if word.lower() in positive_words]
    
    return {
        "text_length": len(text),
        "positive_keywords_found": found_words,
        "score": len(found_words) * 10
    }
