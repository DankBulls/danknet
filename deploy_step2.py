import requests
import time
import os
from pathlib import Path

def deploy_step2():
    """
    Step 2: Upload frontend build files
    """
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}
    
    print("\nUploading frontend build files...")
    project_path = os.path.dirname(os.path.abspath(__file__))
    frontend_path = os.path.join(project_path, 'frontend/build')
    
    # Upload each frontend file
    for item in Path(frontend_path).rglob('*'):
        if item.is_file():
            relative_path = item.relative_to(os.path.join(project_path, 'frontend'))
            remote_path = f'/home/{username}/danknet/frontend/{relative_path}'
            print(f"\nUploading {relative_path}")
            
            with open(str(item), 'rb') as f:
                response = requests.post(
                    f'https://www.pythonanywhere.com/api/v0/user/{username}/files/path{remote_path}',
                    files={'content': f},
                    headers=headers
                )
                print(f"Upload status: {response.status_code}")
                
                if response.status_code not in [200, 201]:
                    print("Upload failed!")
                    return False
                    
            time.sleep(1)  # Delay between uploads
    
    print("\nFrontend files uploaded successfully!")
    return True

if __name__ == "__main__":
    deploy_step2()
