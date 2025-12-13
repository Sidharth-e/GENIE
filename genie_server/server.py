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
from app.tools import analytics, finance, data, visualization, utilities, web, code  # noqa: F401

logger.info("GENIE MCP Server initialized")
logger.info("Registered tool modules: analytics, finance, data, visualization, utilities, web, code")


if __name__ == "__main__":
    logger.info("Starting GENIE MCP Server...")
    mcp.run(transport="streamable-http")