"""
GENIE Server - App Package

This package initializes the FastMCP server and exports it for tool registration.
"""
from mcp.server.fastmcp import FastMCP

from app.config import settings

# Initialize the FastMCP server
mcp = FastMCP(settings.SERVER_NAME)

__all__ = ["mcp"]
