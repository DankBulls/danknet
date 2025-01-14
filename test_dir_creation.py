import requests
import time

def test_directory_creation():
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}
    
    # Try to create a simple directory structure
    print("Creating test directory...")
    
    # First create the parent directory with a .keep file
    parent_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/files/path/home/{username}/test_dir/.keep'
    parent_response = requests.post(
        parent_url,
        headers=headers,
        files={'content': ('', '')}
    )
    
    print(f"Parent directory creation status: {parent_response.status_code}")
    print(f"Response: {parent_response.text}")
    
    # List files to verify
    print("\nListing files...")
    files_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/files/path/home/{username}/'
    files_response = requests.get(files_url, headers=headers)
    
    print(f"File listing status: {files_response.status_code}")
    print("Files in directory:")
    print(files_response.text)

if __name__ == "__main__":
    test_directory_creation()
