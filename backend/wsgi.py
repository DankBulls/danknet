import sys
import os

# Add your project directory to the sys.path
project_home = u'/home/yourusername/danknet/backend'
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

# Import your app from app.py
from app import app as application  # noqa
