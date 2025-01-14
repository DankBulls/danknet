import requests
import time

def test_console():
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    headers = {'Authorization': f'Token {api_token}'}
    
    # Create a console
    print("Creating console...")
    console_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/consoles/'
    console_response = requests.post(
        console_url,
        headers=headers,
        json={'executable': 'bash'}
    )
    
    print(f"Console creation status: {console_response.status_code}")
    print(f"Response: {console_response.text}")
    
    if console_response.status_code in [200, 201]:
        console_id = console_response.json().get('id')
        print(f"\nCreated console with ID: {console_id}")
        
        # Run a simple command
        print("\nRunning 'ls' command...")
        command_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/consoles/{console_id}/send_input/'
        command_response = requests.post(
            command_url,
            headers=headers,
            json={'input': 'ls\n'}
        )
        
        print(f"Command status: {command_response.status_code}")
        print(f"Response: {command_response.text}")
        
        # Wait a bit for command to execute
        time.sleep(5)
        
        # Get output
        print("\nGetting command output...")
        output_url = f'https://www.pythonanywhere.com/api/v0/user/{username}/consoles/{console_id}/get_latest_output/'
        output_response = requests.get(output_url, headers=headers)
        
        print(f"Output status: {output_response.status_code}")
        print("Command output:")
        print(output_response.text)

if __name__ == "__main__":
    test_console()
