import requests
import time
import os

def deploy_step3():
    """
    Step 3: Configure web app and virtual environment
    """
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}
    
    # Create virtual environment
    print("\nCreating virtual environment...")
    venv_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/virtualenvs/'
    venv_response = requests.post(
        venv_url,
        headers=headers,
        json={
            'name': 'danknet-env',
            'python_version': '3.10'
        }
    )
    print(f"Virtual environment creation status: {venv_response.status_code}")
    
    if venv_response.status_code not in [200, 201]:
        print("Failed to create virtual environment!")
        return False
    
    # Configure web app
    print("\nConfiguring web app...")
    webapp_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/webapps/'
    webapp_config = {
        'domain_name': f'{username}.pythonanywhere.com',
        'python_version': '3.10',
        'virtualenv_path': f'/home/{username}/.virtualenvs/danknet-env',
        'source_directory': f'/home/{username}/danknet/backend',
        'working_directory': f'/home/{username}/danknet/backend',
        'static_files': {
            '/static/': f'/home/{username}/danknet/frontend/build/static',
            '/': f'/home/{username}/danknet/frontend/build'
        }
    }
    
    webapp_response = requests.post(webapp_url, headers=headers, json=webapp_config)
    print(f"Web app configuration status: {webapp_response.status_code}")
    print(f"Response: {webapp_response.text}")
    
    if webapp_response.status_code not in [200, 201]:
        print("Failed to configure web app!")
        return False
    
    print("\nDeployment step 3 completed successfully!")
    print(f"Your app should now be available at: https://{username}.pythonanywhere.com")
    print("\nNOTE: You'll need to:")
    print("1. Go to the PythonAnywhere dashboard")
    print("2. Open a Bash console")
    print("3. Run: source ~/.virtualenvs/danknet-env/bin/activate")
    print("4. Run: cd ~/danknet/backend")
    print("5. Run: pip install -r requirements.txt")
    print("6. Go to the Web tab and click 'Reload'")
    
    return True

if __name__ == "__main__":
    deploy_step3()
