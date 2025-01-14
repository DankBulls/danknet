<?php
require_once '../config.php';

header('Content-Type: application/json');

// Get all users
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT id, username, email, role, created_at FROM users";
    $result = $conn->query($sql);
    
    if ($result) {
        $users = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($users);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch users']);
    }
}

// Update user
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['id'])) {
        // Update existing user
        $sql = "UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", 
            $data['username'],
            $data['email'],
            $data['role'],
            $data['id']
        );
    } else {
        // Create new user
        $sql = "INSERT INTO users (username, email, role, password_hash) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $password_hash = password_hash($data['password'] ?? 'changeme123', PASSWORD_DEFAULT);
        $stmt->bind_param("ssss", 
            $data['username'],
            $data['email'],
            $data['role'],
            $password_hash
        );
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $stmt->insert_id ?? $data['id']]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save user']);
    }
}

// Delete user
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }

    $sql = "DELETE FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $_GET['id']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete user']);
    }
}
?>
