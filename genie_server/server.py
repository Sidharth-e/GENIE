"""
GENIE MCP Server - Entry Point

A modular MCP server exposing tools for analytics, finance, and data access.
"""
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

# Import the MCP server instance
from app import mcp

# Import all tool modules to register them with the server
from app.tools import analytics, finance, data, visualization  # noqa: F401

logger.info("GENIE MCP Server initialized")
logger.info(f"Registered tools: calculate_metrics, analyze_sentiment_keyword, get_stock_price, get_userData")


if __name__ == "__main__":
    logger.info("Starting GENIE MCP Server...")
    mcp.run(transport="streamable-http")