from flask import current_app
from google.oauth2 import id_token
from google.auth.transport import requests
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime, timedelta
import jwt

class AuthService:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME')
        }
        self.google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.jwt_secret = os.getenv('JWT_SECRET_KEY')

    def verify_google_token(self, token):
        try:
            # Verify the Google token
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                self.google_client_id
            )

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')

            return {
                'google_id': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo['name'],
                'picture': idinfo.get('picture')
            }
        except Exception as e:
            print(f"Error verifying Google token: {str(e)}")
            return None

    def get_db_connection(self):
        try:
            connection = mysql.connector.connect(**self.db_config)
            return connection
        except Error as e:
            print(f"Error connecting to MySQL: {str(e)}")
            return None

    def verify_user_credentials(self, email, password):
        connection = self.get_db_connection()
        if not connection:
            return None

        try:
            cursor = connection.cursor(dictionary=True)
            query = """
                SELECT id, email, name, google_id, role
                FROM users
                WHERE email = %s AND password = %s
            """
            cursor.execute(query, (email, password))
            user = cursor.fetchone()
            return user
        except Error as e:
            print(f"Database error: {str(e)}")
            return None
        finally:
            cursor.close()
            connection.close()

    def get_user_by_google_id(self, google_id):
        connection = self.get_db_connection()
        if not connection:
            return None

        try:
            cursor = connection.cursor(dictionary=True)
            query = """
                SELECT id, email, name, google_id, role
                FROM users
                WHERE google_id = %s
            """
            cursor.execute(query, (google_id,))
            user = cursor.fetchone()
            return user
        except Error as e:
            print(f"Database error: {str(e)}")
            return None
        finally:
            cursor.close()
            connection.close()

    def create_or_update_user(self, user_data):
        connection = self.get_db_connection()
        if not connection:
            return None

        try:
            cursor = connection.cursor(dictionary=True)
            
            # Check if user exists
            query = "SELECT id FROM users WHERE google_id = %s OR email = %s"
            cursor.execute(query, (user_data['google_id'], user_data['email']))
            existing_user = cursor.fetchone()

            if existing_user:
                # Update existing user
                query = """
                    UPDATE users 
                    SET name = %s, picture = %s, last_login = NOW()
                    WHERE id = %s
                """
                cursor.execute(query, (
                    user_data['name'],
                    user_data.get('picture'),
                    existing_user['id']
                ))
                user_id = existing_user['id']
            else:
                # Create new user
                query = """
                    INSERT INTO users (google_id, email, name, picture, created_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """
                cursor.execute(query, (
                    user_data['google_id'],
                    user_data['email'],
                    user_data['name'],
                    user_data.get('picture')
                ))
                user_id = cursor.lastrowid

            connection.commit()
            
            # Get complete user data
            query = "SELECT * FROM users WHERE id = %s"
            cursor.execute(query, (user_id,))
            return cursor.fetchone()
        except Error as e:
            print(f"Database error: {str(e)}")
            connection.rollback()
            return None
        finally:
            cursor.close()
            connection.close()

    def generate_jwt_token(self, user):
        try:
            payload = {
                'user_id': user['id'],
                'email': user['email'],
                'role': user['role'],
                'exp': datetime.utcnow() + timedelta(days=1)
            }
            token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
            return token
        except Exception as e:
            print(f"Error generating JWT: {str(e)}")
            return None

    def verify_jwt_token(self, token):
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
