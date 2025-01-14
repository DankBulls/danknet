import requests
import json

def main():
    # Your credentials
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}
    
    # First, let's just try to create a console
    print("Creating a console...")
    console_url = 'https://www.pythonanywhere.com/api/v0/user/dankbulls/consoles/'
    console_data = {
        'executable': 'bash',
        'input': 'mkdir -p /home/dankbulls/danknet/test'
    }
    
    try:
        response = requests.post(console_url, headers=headers, json=console_data)
        print(f"Status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
