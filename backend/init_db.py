import os
import sys
from pathlib import Path

# Get the absolute path to the backend directory
backend_dir = Path(__file__).parent.absolute()
project_dir = backend_dir.parent

# Add project directory to Python path
sys.path.append(str(project_dir))

# Change working directory to backend
os.chdir(str(backend_dir))

from backend import create_app, db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Create data directory if it doesn't exist
        data_dir = Path('data')
        data_dir.mkdir(exist_ok=True)
        
        # Create database tables
        db.create_all()
        print("Database tables created successfully!")
