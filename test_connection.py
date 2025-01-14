import requests

def test_connection():
    print("Testing connection to PythonAnywhere API...")
    
    # Your credentials
    username = 'dankbulls'
    api_token = '825aab866d100653025c7bbc579956f7a26e0ae4'
    
    # Test URL - using the correct API endpoint
    url = 'https://www.pythonanywhere.com/api/v0/user/dankbulls/cpu/'  # Changed to a valid endpoint
    headers = {'Authorization': f'Token {api_token}'}
    
    try:
        # First, try a simple GET request
        print("\nTesting simple GET request...")
        response = requests.get('https://www.pythonanywhere.com')
        print(f"Basic website connection: {response.status_code}")
        
        # Then try the API with verbose output
        print("\nTesting API connection...")
        print(f"Using URL: {url}")
        print(f"Using headers: {headers}")
        api_response = requests.get(url, headers=headers, verify=True)  # Added verify=True to show SSL is working
        print(f"API Status Code: {api_response.status_code}")
        print(f"API Response: {api_response.text}")
        
    except requests.exceptions.SSLError as e:
        print("\nSSL Error occurred. This might be due to SSL/TLS settings:")
        print(str(e))
        
    except requests.exceptions.ProxyError as e:
        print("\nProxy Error occurred. This might be due to proxy settings:")
        print(str(e))
        
    except requests.exceptions.ConnectionError as e:
        print("\nConnection Error occurred. This might be due to network settings:")
        print(str(e))
        
    except Exception as e:
        print("\nUnexpected error:")
        print(str(e))

if __name__ == "__main__":
    test_connection()
