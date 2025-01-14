<?php
require_once '../config.php';

header('Access-Control-Allow-Origin: https://app.dankbulls.com');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['credential'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No credential provided']);
        exit();
    }

    // Verify the Google token
    $client = new Google_Client(['client_id' => $GOOGLE_CLIENT_ID]);
    try {
        $payload = $client->verifyIdToken($data['credential']);
        if (!$payload) {
            throw new Exception('Invalid token');
        }

        $google_id = $payload['sub'];
        $email = $payload['email'];
        $name = $payload['name'];
        $picture = $payload['picture'];

        // Check if user exists
        $stmt = $conn->prepare("SELECT * FROM users WHERE google_id = ? OR email = ?");
        $stmt->bind_param("ss", $google_id, $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if ($user) {
            // Update existing user
            $stmt = $conn->prepare("UPDATE users SET 
                google_id = ?,
                picture = ?,
                last_login = NOW()
                WHERE id = ?");
            $stmt->bind_param("ssi", $google_id, $picture, $user['id']);
            $stmt->execute();
        } else {
            // Create new user
            $username = explode('@', $email)[0];
            $role = $email === 'dankbulls@gmail.com' ? 'admin' : 'user';
            
            $stmt = $conn->prepare("INSERT INTO users 
                (email, username, role, google_id, picture) 
                VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $email, $username, $role, $google_id, $picture);
            $stmt->execute();
            
            $user_id = $conn->insert_id;
            $user = [
                'id' => $user_id,
                'email' => $email,
                'username' => $username,
                'role' => $role,
                'picture' => $picture
            ];
        }

        // Set session
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'username' => $user['username'],
                'role' => $user['role'],
                'picture' => $user['picture']
            ]
        ]);

    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode([
            'error' => 'Authentication failed',
            'details' => $e->getMessage()
        ]);
    }
}
?>
