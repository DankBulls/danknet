#!/bin/bash

# Create virtual environment
mkvirtualenv --python=python3.10 danknet-env

# Activate virtual environment
source ~/.virtualenvs/danknet-env/bin/activate

# Install requirements
cd ~/danknet/backend
pip install -r requirements.txt

# Set up the database
python init_db.py

# Print completion message
echo "Setup completed!"
