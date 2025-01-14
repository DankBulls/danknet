import requests
import time

def test_deployment():
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}
    
    # First, let's check if we can access the API
    print("Testing API access...")
    test_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/cpu/'
    response = requests.get(test_url, headers=headers)
    print(f"API test response: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\nAPI access successful!")
        
        # Create a test file
        print("\nCreating test file...")
        file_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/files/path/home/{username}/test.txt'
        file_content = "Hello from DankNet!"
        
        file_response = requests.post(
            file_url,
            headers=headers,
            files={'content': ('test.txt', file_content)}
        )
        
        print(f"File creation status: {file_response.status_code}")
        print(f"Response: {file_response.text}")
        
        # List files in home directory
        print("\nListing files in home directory...")
        files_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/files/path/home/{username}/'
        files_response = requests.get(files_url, headers=headers)
        
        print(f"File listing status: {files_response.status_code}")
        print("Files in directory:")
        print(files_response.text)
        
    else:
        print("Failed to access API")

if __name__ == "__main__":
    test_deployment()
