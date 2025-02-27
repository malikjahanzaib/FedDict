import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(env_path):
    logger.info(f"Loading environment from {env_path}")
    load_dotenv(env_path)
else:
    logger.warning(f".env file not found at {env_path}")

# Get MongoDB URL from environment variable
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    logger.error("MONGODB_URL environment variable not set")
    raise ValueError(
        "No MongoDB URL found. "
        "Make sure MONGODB_URL environment variable is set"
    )

# Admin credentials
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "secure_pass")

# Print debug info (remove in production)
logger.info(f"Using MongoDB URL: {MONGODB_URL[:10]}...")
logger.info(f"Admin username: {ADMIN_USERNAME}") 