"""
Load environment variables from .env.local file for Python scripts
This ensures credentials are read from the .env.local file without hardcoding them
"""
import os
from pathlib import Path

def load_env_file():
    """Load environment variables from .env.local"""
    env_path = Path(__file__).parent / '.env.local'
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
    else:
        print(f"Warning: .env.local file not found at {env_path}")

# Load environment variables when this module is imported
load_env_file()