<?php
require_once '../config.php';

header('Content-Type: application/json');

// First, add google_id column if it doesn't exist
$sql = "ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS picture VARCHAR(255) NULL";

if (!$conn->query($sql)) {
    echo json_encode([
        'error' => 'Failed to modify table structure',
        'details' => $conn->error
    ]);
    exit;
}

// Check if admin user exists
$sql = "SELECT id FROM users WHERE email = 'dankbulls@gmail.com'";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    // Update existing admin user
    $sql = "UPDATE users SET 
            role = 'admin',
            username = 'dankbulls'
            WHERE email = 'dankbulls@gmail.com'";
    
    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'Admin user updated successfully',
            'user' => [
                'email' => 'dankbulls@gmail.com',
                'username' => 'dankbulls',
                'role' => 'admin'
            ]
        ]);
    } else {
        echo json_encode([
            'error' => 'Failed to update admin user',
            'details' => $conn->error
        ]);
    }
} else {
    // Create new admin user
    $sql = "INSERT INTO users (email, username, role) 
            VALUES ('dankbulls@gmail.com', 'dankbulls', 'admin')";
    
    if ($conn->query($sql)) {
        echo json_encode([
            'success' => true,
            'message' => 'Admin user created successfully',
            'user' => [
                'email' => 'dankbulls@gmail.com',
                'username' => 'dankbulls',
                'role' => 'admin'
            ]
        ]);
    } else {
        echo json_encode([
            'error' => 'Failed to create admin user',
            'details' => $conn->error
        ]);
    }
}
