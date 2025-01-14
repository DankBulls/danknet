from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from functools import wraps

auth_blueprint = Blueprint('auth', __name__)
auth_service = AuthService()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401

        token = auth_header.split(' ')[1]
        user = auth_service.verify_jwt_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401

        return f(*args, **kwargs)
    return decorated_function

@auth_blueprint.route('/api/auth/google', methods=['POST'])
def google_auth():
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 400

        # Verify Google token
        google_user = auth_service.verify_google_token(token)
        if not google_user:
            return jsonify({'error': 'Invalid Google token'}), 401

        # Create or update user in database
        user = auth_service.create_or_update_user(google_user)
        if not user:
            return jsonify({'error': 'Failed to create/update user'}), 500

        # Generate JWT token
        jwt_token = auth_service.generate_jwt_token(user)
        if not jwt_token:
            return jsonify({'error': 'Failed to generate token'}), 500

        return jsonify({
            'token': jwt_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'picture': user.get('picture'),
                'role': user['role']
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_blueprint.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        # Verify credentials
        user = auth_service.verify_user_credentials(email, password)
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate JWT token
        jwt_token = auth_service.generate_jwt_token(user)
        if not jwt_token:
            return jsonify({'error': 'Failed to generate token'}), 500

        return jsonify({
            'token': jwt_token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_blueprint.route('/api/auth/verify', methods=['GET'])
@login_required
def verify_token():
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1]
    user = auth_service.verify_jwt_token(token)
    
    return jsonify({
        'valid': True,
        'user': user
    })
