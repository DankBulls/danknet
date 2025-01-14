import requests
import time
import os
from pathlib import Path

def handle_rate_limit(response):
    """Handle rate limiting by waiting if necessary"""
    if response.status_code == 429:
        retry_after = int(response.headers.get('Retry-After', 30))
        print(f"\nRate limit hit. Waiting {retry_after} seconds...")
        time.sleep(retry_after)
        return True
    return False

def deploy_step1():
    """
    Step 1: Upload backend files
    """
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}
    
    # Test API connection first
    print("Testing API connection...")
    test_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/cpu/'
    response = requests.get(test_url, headers=headers)
    if response.status_code != 200:
        print("Failed to connect to API")
        return False
    
    print("\nUploading backend files...")
    project_path = os.path.dirname(os.path.abspath(__file__))
    backend_path = os.path.join(project_path, 'backend')
    
    # First, count total files
    total_files = sum(1 for _ in Path(backend_path).rglob('*') if _.is_file())
    current_file = 0
    
    # Upload each backend file
    for item in Path(backend_path).rglob('*'):
        if item.is_file():
            current_file += 1
            relative_path = item.relative_to(project_path)
            remote_path = f'/home/{username}/{relative_path}'
            print(f"\n[{current_file}/{total_files}] Uploading {relative_path}")
            
            while True:  # Keep trying until success or non-rate-limit error
                with open(str(item), 'rb') as f:
                    print(f"  Sending request...")
                    response = requests.post(
                        f'https://www.pythonanywhere.com/api/v0/user/{username}/files/path{remote_path}',
                        files={'content': f},
                        headers=headers
                    )
                    print(f"  Upload status: {response.status_code}")
                    
                    if not handle_rate_limit(response):
                        break
                        
                if response.status_code not in [200, 201]:
                    print(f"  Upload failed for {relative_path}!")
                    return False
                    
            print(f"  Successfully uploaded {relative_path}")
            time.sleep(2)  # Longer delay between uploads
    
    print("\nBackend files uploaded successfully!")
    return True

if __name__ == "__main__":
    deploy_step1()
