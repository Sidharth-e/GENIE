"""
Configuration module for GENIE Server.

Centralizes all configuration settings with environment variable support.
"""
import os
from dataclasses import dataclass


@dataclass
class Settings:
    """Application settings with defaults."""
    
    # Server Configuration
    SERVER_NAME: str = "Genie-MCP-Server"
    SERVER_HOST: str = "localhost"
    SERVER_PORT: int = 8000
    
    # MongoDB Configuration
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DEFAULT_DB: str = os.getenv("MONGO_DEFAULT_DB", "fitbit")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


# Global settings instance
settings = Settings()
