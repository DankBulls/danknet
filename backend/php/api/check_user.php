<?php
require_once '../config.php';

header('Content-Type: application/json');

// Check database connection
if ($conn->connect_error) {
    echo json_encode([
        'error' => 'Database connection failed',
        'details' => $conn->connect_error
    ]);
    exit;
}

// Get all users to check the table
$all_users = [];
$result = $conn->query("SELECT id, username, email, role FROM users");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $all_users[] = $row;
    }
}

// Get admin user specifically
$sql = "SELECT id, username, email, role FROM users WHERE username = 'admin'";
$admin_result = $conn->query($sql);
$admin_user = $admin_result ? $admin_result->fetch_assoc() : null;

// Return detailed information
echo json_encode([
    'database_connected' => true,
    'total_users' => count($all_users),
    'all_users' => $all_users,
    'admin_user' => $admin_user,
    'php_version' => PHP_VERSION,
    'server_time' => date('Y-m-d H:i:s')
]);
?>
