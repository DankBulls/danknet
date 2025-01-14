import requests

def test_deploy():
    # Credentials
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}

    # Step 1: Test API connection
    print("Step 1: Testing API connection...")
    test_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/cpu/'
    try:
        response = requests.get(test_url, headers=headers)
        print(f"Connection test status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("\nAPI connection successful!")
            
            # Step 2: Create a directory
            print("\nStep 2: Creating directory...")
            console_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/consoles/'
            console_response = requests.post(
                console_url,
                headers=headers,
                json={
                    'executable': 'bash',
                    'input': f'mkdir -p /home/{username}/danknet/test'
                }
            )
            print(f"Directory creation status: {console_response.status_code}")
            print(f"Response: {console_response.text}")
            
        else:
            print("Failed to connect to API")
            
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    test_deploy()
