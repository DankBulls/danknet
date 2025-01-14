<?php
require_once '../config.php';

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Enable CORS
header('Access-Control-Allow-Origin: https://dankbulls.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Start session for all requests
session_start();

// Log function
function logDebug($message, $data = null) {
    error_log(sprintf(
        "[DankNet Auth] %s - %s - %s\n",
        date('Y-m-d H:i:s'),
        $message,
        $data ? json_encode($data) : 'no data'
    ));
}

require_once '../vendor/autoload.php';

use Google\Client as GoogleClient;

function debug_log($message) {
    error_log(print_r($message, true));
}

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function verify_google_token($token) {
    try {
        $segments = explode('.', $token);
        if (count($segments) !== 3) {
            return null;
        }

        $payload = json_decode(base64url_decode($segments[1]), true);
        
        if (!$payload) {
            return null;
        }

        // Verify token is not expired
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        // Verify the token was intended for our app
        if (!isset($payload['aud']) || $payload['aud'] !== GOOGLE_CLIENT_ID) {
            return null;
        }

        // Verify token was issued by Google
        if (!isset($payload['iss']) || !in_array($payload['iss'], [
            'accounts.google.com',
            'https://accounts.google.com'
        ])) {
            return null;
        }

        return [
            'email' => $payload['email'],
            'name' => $payload['name'] ?? null
        ];
    } catch (Exception $e) {
        error_log("Token verification failed: " . $e->getMessage());
        return null;
    }
}

function get_or_create_user($email, $name = null, $picture = null, $role = 'user') {
    global $conn;
    
    try {
        // Check if user exists
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            return $user;
        }
        
        // Create new user
        $username = explode('@', $email)[0]; // Use part before @ as username
        $default_hash = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT); // Random secure password for Google auth users
        
        $stmt = $conn->prepare("INSERT INTO users (username, email, role, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->bind_param("ssss", $username, $email, $role, $default_hash);
        $stmt->execute();
        
        return [
            'id' => $conn->insert_id,
            'username' => $username,
            'email' => $email,
            'role' => $role
        ];
    } catch (Exception $e) {
        debug_log("Database error: " . $e->getMessage());
        return null;
    }
}

function check_invitation($email) {
    global $conn;
    
    // Admin email doesn't need invitation
    if ($email === 'dankbulls@gmail.com') {
        return true;
    }
    
    $stmt = $conn->prepare("SELECT * FROM invitations WHERE email = ? AND used_at IS NULL");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result->num_rows > 0;
}

function mark_invitation_used($email) {
    global $conn;
    
    $stmt = $conn->prepare("UPDATE invitations SET used_at = CURRENT_TIMESTAMP WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
}

function is_admin($user_id) {
    global $conn;
    
    $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        return $user['role'] === 'admin';
    }
    
    return false;
}

function create_invitation($email, $admin_id) {
    global $conn;
    
    $invitation_code = bin2hex(random_bytes(16));
    
    $stmt = $conn->prepare("INSERT INTO invitations (email, invitation_code, created_by) VALUES (?, ?, ?)");
    $stmt->bind_param("ssi", $email, $invitation_code, $admin_id);
    
    if ($stmt->execute()) {
        return [
            'success' => true,
            'invitation_code' => $invitation_code
        ];
    }
    
    return ['success' => false, 'error' => 'Failed to create invitation'];
}

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Handle POST request for login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    logDebug('Raw input', file_get_contents('php://input'));
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit();
    }
    
    if (isset($data['googleCredential'])) {
        $googleUser = verify_google_token($data['googleCredential']);
        
        if (!$googleUser) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid Google token']);
            exit;
        }
        
        $email = $googleUser['email'];
        
        // Check for invitation unless it's the admin
        if (!check_invitation($email)) {
            http_response_code(403);
            echo json_encode(['error' => 'You need an invitation to join DankNet']);
            exit;
        }
        
        $user = get_or_create_user($email, $googleUser['name'], null, 'user');
        if ($user) {
            mark_invitation_used($email);
        }
        
        if (!$user) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create/retrieve user']);
            exit;
        }
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        
        logDebug('Login successful', $user);
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'username' => $user['username'],
                'role' => $user['role']
            ]
        ]);
        exit();
    }
    
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        exit();
    }

    // For now, allow login with dankbulls@gmail.com and a simple password
    if ($data['email'] === 'dankbulls@gmail.com' && $data['password'] === 'dankbulls123') {
        try {
            // Check if user exists
            $sql = "SELECT * FROM users WHERE email = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Failed to prepare statement: " . $conn->error);
            }
            
            $stmt->bind_param("s", $data['email']);
            if (!$stmt->execute()) {
                throw new Exception("Failed to execute statement: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();

            if (!$user) {
                // Create admin user if it doesn't exist
                $sql = "INSERT INTO users (email, username, role) VALUES (?, 'dankbulls', 'admin')";
                $stmt = $conn->prepare($sql);
                if (!$stmt) {
                    throw new Exception("Failed to prepare insert statement: " . $conn->error);
                }
                
                $stmt->bind_param("s", $data['email']);
                if (!$stmt->execute()) {
                    throw new Exception("Failed to create user: " . $stmt->error);
                }
                
                $user = [
                    'id' => $conn->insert_id,
                    'email' => $data['email'],
                    'username' => 'dankbulls',
                    'role' => 'admin'
                ];
            }

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            
            logDebug('Login successful', $user);
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'username' => $user['username'],
                    'role' => $user['role']
                ]
            ]);
            exit();
        } catch (Exception $e) {
            logDebug('Login error', ['error' => $e->getMessage()]);
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Server error: ' . $e->getMessage()
            ]);
            exit();
        }
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid email or password'
        ]);
        exit();
    }
}

// Handle GET request for user info
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['action'])) {
    logDebug('Checking auth status', ['session_id' => session_id()]);
    
    if (isset($_SESSION['user_id'])) {
        try {
            $sql = "SELECT id, email, username, role FROM users WHERE id = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Failed to prepare statement: " . $conn->error);
            }
            
            $stmt->bind_param("i", $_SESSION['user_id']);
            if (!$stmt->execute()) {
                throw new Exception("Failed to execute statement: " . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if ($user) {
                echo json_encode([
                    'success' => true,
                    'isAuthenticated' => true,
                    'user' => $user
                ]);
            } else {
                logDebug('User not found in database', ['user_id' => $_SESSION['user_id']]);
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'User not found',
                    'isAuthenticated' => false
                ]);
            }
        } catch (Exception $e) {
            logDebug('Auth check error', ['error' => $e->getMessage()]);
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Server error: ' . $e->getMessage(),
                'isAuthenticated' => false
            ]);
        }
    } else {
        logDebug('No user session found');
        echo json_encode([
            'success' => false,
            'error' => 'Not authenticated',
            'isAuthenticated' => false
        ]);
    }
    exit();
}

// Handle logout
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    logDebug('Logging out user', ['user_id' => $_SESSION['user_id'] ?? 'not set']);
    session_destroy();
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
    exit();
}

// Handle invitation creation (admin only)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_invitation') {
    if (!isset($_SESSION['user_id']) || !is_admin($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }
    
    if (!isset($_POST['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email required']);
        exit;
    }
    
    $result = create_invitation($_POST['email'], $_SESSION['user_id']);
    echo json_encode($result);
    exit;
}
?>
