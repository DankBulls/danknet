import os
import sys
import requests
import json
from pathlib import Path
import time

class PythonAnywhereDeployer:
    def __init__(self):
        self.username = 'dankbulls'
        self.api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
        self.headers = {'Authorization': f'Token {self.api_token}'}
        self.mysql_password = 'ILoveWindsurf'
        self.database_name = 'dankbulls$default'
        
    def handle_rate_limit(self, response):
        """Handle rate limiting by waiting if necessary"""
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 30))
            print(f"\nRate limit hit. Waiting {retry_after} seconds...")
            time.sleep(retry_after)
            return True
        return False
        
    def run_console_command(self, command):
        """Run a command in a new console"""
        print(f"\nRunning command: {command}")
        
        # First create a console
        console_url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/consoles/'
        console_response = requests.post(
            console_url,
            headers=self.headers,
            json={'executable': 'bash'}
        )
        
        if console_response.status_code not in [200, 201]:
            print(f"Failed to create console. Status: {console_response.status_code}")
            print(f"Response: {console_response.text}")
            return False
            
        try:
            console_id = console_response.json().get('id')
            print(f"Created console with ID: {console_id}")
            
            # Send the command
            command_url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/consoles/{console_id}/send_input/'
            command_response = requests.post(
                command_url,
                headers=self.headers,
                json={'input': f'{command}\n'}
            )
            
            if command_response.status_code not in [200, 201]:
                print(f"Failed to send command. Status: {command_response.status_code}")
                print(f"Response: {command_response.text}")
                return False
                
            print(f"Command sent successfully. Status: {command_response.status_code}")
            
            # Give some time for the command to execute
            time.sleep(5)
            
            # Get console output
            output_url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/consoles/{console_id}/get_latest_output/'
            output_response = requests.get(output_url, headers=self.headers)
            
            if output_response.status_code == 200:
                print("\nConsole output:")
                print(output_response.text)
            
            return True
            
        except Exception as e:
            print(f"Error running console command: {str(e)}")
            return False

    def check_directory(self, path):
        """Check if a directory exists"""
        url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/files/path{path}'
        response = requests.get(url, headers=self.headers)
        return response.status_code == 200

    def create_directory(self, path):
        """Create a directory by uploading a .keep file"""
        keep_file_url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/files/path{path}/.keep'
        response = requests.post(
            keep_file_url,
            headers=self.headers,
            files={'content': ('content', '')}
        )
        return response.status_code in [200, 201]

    def create_directories(self):
        """Create necessary directories if they don't exist"""
        print("\nChecking/creating directories...")
        directories = [
            f'/home/{self.username}/danknet',
            f'/home/{self.username}/danknet/backend',
            f'/home/{self.username}/danknet/frontend',
            f'/home/{self.username}/danknet/frontend/build',
            f'/home/{self.username}/danknet/frontend/build/static'
        ]
        
        for directory in directories:
            if not self.check_directory(directory):
                print(f"Creating {directory}...")
                if not self.create_directory(directory):
                    print(f"Failed to create {directory}")
                    return False
                time.sleep(1)  # Small delay between requests
            else:
                print(f"Directory exists: {directory}")
        
        return True

    def upload_files(self, local_path):
        """Upload files to PythonAnywhere"""
        print("\nUploading files...")
        
        def upload_file(local_file, remote_path):
            while True:
                print(f"\nUploading {local_file} to {remote_path}...")
                url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/files/path{remote_path}'
                
                with open(local_file, 'rb') as f:
                    response = requests.post(url, files={'content': f}, headers=self.headers)
                    print(f"Upload status: {response.status_code}")
                    
                    if not self.handle_rate_limit(response):
                        break
                        
                    time.sleep(2)  # Small delay between retries
                    
                return response.status_code == 201

        success = True
        # Upload backend files
        print("\nUploading backend files...")
        backend_path = os.path.join(local_path, 'backend')
        for item in Path(backend_path).rglob('*'):
            if item.is_file():
                relative_path = item.relative_to(local_path)
                remote_path = f'/home/{self.username}/danknet/{relative_path}'
                if not upload_file(str(item), remote_path):
                    success = False
                time.sleep(1)  # Add delay between file uploads

        # Upload frontend build files
        print("\nUploading frontend files...")
        frontend_path = os.path.join(local_path, 'frontend/build')
        for item in Path(frontend_path).rglob('*'):
            if item.is_file():
                relative_path = item.relative_to(os.path.join(local_path, 'frontend'))
                remote_path = f'/home/{self.username}/danknet/frontend/{relative_path}'
                if not upload_file(str(item), remote_path):
                    success = False
                time.sleep(1)  # Add delay between file uploads

        return success

    def upload_setup_script(self):
        """Upload and make the setup script executable"""
        print("\nUploading setup script...")
        script_url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/files/path/home/{self.username}/setup.sh'
        
        with open('setup.sh', 'rb') as f:
            response = requests.post(script_url, files={'content': f}, headers=self.headers)
            print(f"Script upload status: {response.status_code}")
            
        return response.status_code == 201

    def create_virtualenv(self):
        """Create and configure virtual environment"""
        print("\nSetting up virtual environment...")
        while True:
            url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/virtualenvs/'
            response = requests.post(
                url,
                headers=self.headers,
                json={
                    'name': 'danknet-env',
                    'python_version': '3.10'
                }
            )
            print(f"Virtualenv creation status: {response.status_code}")
            
            if not self.handle_rate_limit(response):
                break
                
            time.sleep(2)  # Small delay between retries
            
        return response.status_code == 201

    def install_requirements(self):
        """Install Python packages from requirements.txt"""
        print("\nInstalling requirements...")
        return self.run_console_command(
            f'source ~/.virtualenvs/danknet-env/bin/activate && cd /home/{self.username}/danknet/backend && pip install -r requirements.txt'
        )

    def configure_webapp(self):
        """Configure the web app settings"""
        print("\nConfiguring web app...")
        url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/webapps/'
        
        webapp_config = {
            'domain_name': f'{self.username}.pythonanywhere.com',
            'python_version': '3.10',
            'virtualenv_path': f'/home/{self.username}/.virtualenvs/danknet-env',
            'source_directory': f'/home/{self.username}/danknet/backend',
            'working_directory': f'/home/{self.username}/danknet/backend',
            'static_files': {
                '/static/': f'/home/{self.username}/danknet/frontend/build/static',
                '/': f'/home/{self.username}/danknet/frontend/build'
            },
            'wsgi_configuration': f'/home/{self.username}/danknet/backend/wsgi.py'
        }
        
        response = requests.post(url, headers=self.headers, json=webapp_config)
        print(f"Webapp configuration status: {response.status_code}")
        print(f"Response: {response.text}")
        
        return response.status_code in [200, 201]

    def set_env_variables(self):
        """Set environment variables"""
        print("\nSetting environment variables...")
        url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/webapps/{self.username}.pythonanywhere.com/env_vars/'
        
        env_vars = {
            'FLASK_ENV': 'production',
            'SECRET_KEY': os.urandom(24).hex(),
            'DATABASE_URL': f'mysql://{self.username}:{self.mysql_password}@{self.username}.mysql.pythonanywhere-services.com/{self.database_name}'
        }
        
        success = True
        for key, value in env_vars.items():
            while True:
                response = requests.post(
                    url,
                    headers=self.headers,
                    json={'name': key, 'value': value}
                )
                print(f"Setting {key} status: {response.status_code}")
                
                if not self.handle_rate_limit(response):
                    break
                    
                time.sleep(2)  # Small delay between retries
                
            if response.status_code != 201:
                success = False
            time.sleep(1)  # Add delay between variable sets
        
        return success

    def reload_webapp(self):
        """Reload the web application"""
        print("\nReloading web app...")
        while True:
            url = f'https://www.pythonanywhere.com/api/v0/user/{self.username}/webapps/{self.username}.pythonanywhere.com/reload/'
            response = requests.post(url, headers=self.headers)
            print(f"Webapp reload status: {response.status_code}")
            
            if not self.handle_rate_limit(response):
                break
                
            time.sleep(2)  # Small delay between retries
            
        return response.status_code == 200

def main():
    print("DankNet Deployment to PythonAnywhere")
    print("====================================")
    
    # Get the absolute path of the project
    project_path = os.path.dirname(os.path.abspath(__file__))
    
    # Create deployer instance
    deployer = PythonAnywhereDeployer()
    
    try:
        # Test API connection
        print("\nTesting API connection...")
        test_url = f'https://www.pythonanywhere.com/api/v0/user/{deployer.username}/cpu/'
        test_response = requests.get(test_url, headers=deployer.headers)
        print(f"API test response: {test_response.status_code}")
        
        if test_response.status_code != 200:
            print("Failed to connect to PythonAnywhere API. Please check your credentials.")
            sys.exit(1)
            
        # Run deployment steps
        steps = [
            ("Creating directories", deployer.create_directories),
            ("Uploading files", lambda: deployer.upload_files(project_path)),
            ("Uploading setup script", deployer.upload_setup_script),
            ("Creating virtual environment", deployer.create_virtualenv),
            ("Installing requirements", deployer.install_requirements),
            ("Setting environment variables", deployer.set_env_variables),
            ("Configuring web app", deployer.configure_webapp),
            ("Reloading web app", deployer.reload_webapp)
        ]
        
        for step_name, step_func in steps:
            print(f"\nExecuting step: {step_name}")
            if not step_func():
                print(f"Failed at step: {step_name}")
                sys.exit(1)
            print(f"Completed step: {step_name}")
            time.sleep(2)  # Small delay between steps
        
        print("\nDeployment completed successfully!")
        print(f"Your app should now be available at: https://{deployer.username}.pythonanywhere.com")
        
    except Exception as e:
        print(f"\nAn error occurred during deployment:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
