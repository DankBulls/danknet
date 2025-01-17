from flask import Flask, jsonify, request, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
from flask_socketio import SocketIO
import logging
from flask_login import UserMixin, login_required, current_user, LoginManager
from datetime import datetime
from pathlib import Path
import ai_predictor
from . import db, create_app, login_manager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = create_app()
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
login_manager.init_app(app)

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://yourusername.pythonanywhere.com",  # Update this with your PythonAnywhere domain
            "http://localhost:3000"  # Keep this for local development
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

socketio = SocketIO(app, cors_allowed_origins=[
    "https://yourusername.pythonanywhere.com",  # Update this with your PythonAnywhere domain
    "http://localhost:3000"
])

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except Exception as e:
        logger.error(f"Error loading user {user_id}: {str(e)}")
        return None

class Hunt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    gmu_id = db.Column(db.String(20), nullable=False, index=True)
    date = db.Column(db.DateTime, nullable=False)
    success = db.Column(db.Boolean, default=False)
    animal_type = db.Column(db.String(50))
    lat = db.Column(db.Float)
    lon = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class GMU(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gmu_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100))
    boundary = db.Column(db.Text)  # GeoJSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/predictions', methods=['GET'])
@login_required
def get_predictions():
    try:
        # Get bounds from request
        bounds = {
            'north': float(request.args.get('north', 40.25)),
            'south': float(request.args.get('south', 39.75)),
            'east': float(request.args.get('east', -105.75)),
            'west': float(request.args.get('west', -106.25))
        }
        
        # Get predictions
        predictions = ai_predictor.GamePredictor().get_hotspots(bounds)
        
        return jsonify({
            'status': 'success',
            'predictions': predictions
        })
        
    except Exception as e:
        logger.error(f"Error in get_predictions: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/hunts', methods=['POST'])
@login_required
def record_hunt():
    try:
        data = request.get_json()
        
        hunt = Hunt(
            user_id=current_user.id,
            gmu_id=data['gmu_id'],
            date=datetime.fromisoformat(data['date']),
            success=data['success'],
            animal_type=data['animal_type'],
            lat=data.get('lat'),
            lon=data.get('lon'),
            notes=data.get('notes')
        )
        
        db.session.add(hunt)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Hunt recorded successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in record_hunt: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/gmus', methods=['GET'])
def get_gmus():
    try:
        gmus = GMU.query.all()
        return jsonify({
            'status': 'success',
            'gmus': [{
                'id': gmu.gmu_id,
                'name': gmu.name,
                'boundary': gmu.boundary
            } for gmu in gmus]
        })
    except Exception as e:
        logger.error(f"Error in get_gmus: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/')
def index():
    return jsonify({"message": "DankNet API is running"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
