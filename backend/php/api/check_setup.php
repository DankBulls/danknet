<?php
require_once '../config.php';

header('Content-Type: application/json');

// Check database connection
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'details' => $conn->connect_error
    ]);
    exit;
}

// Check if users table exists and has the right columns
$result = $conn->query("DESCRIBE users");
if (!$result) {
    echo json_encode([
        'success' => false,
        'error' => 'Users table does not exist',
        'details' => $conn->error
    ]);
    exit;
}

$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row['Field'];
}

// Check for required columns
$required_columns = ['id', 'email', 'username', 'role', 'google_id', 'picture'];
$missing_columns = array_diff($required_columns, $columns);

if (!empty($missing_columns)) {
    echo json_encode([
        'success' => false,
        'error' => 'Missing required columns',
        'missing_columns' => $missing_columns
    ]);
    exit;
}

// Check if admin user exists
$result = $conn->query("SELECT * FROM users WHERE email = 'dankbulls@gmail.com'");
$admin_user = $result ? $result->fetch_assoc() : null;

// Get all users
$result = $conn->query("SELECT id, email, username, role FROM users");
$all_users = [];
while ($row = $result->fetch_assoc()) {
    $all_users[] = $row;
}

echo json_encode([
    'success' => true,
    'database_connected' => true,
    'table_structure' => [
        'table_exists' => true,
        'columns' => $columns
    ],
    'admin_user' => $admin_user,
    'total_users' => count($all_users),
    'all_users' => $all_users
]);
