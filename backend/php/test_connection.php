<?php
require_once 'config.php';

// Test database connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} else {
    echo "Database connection successful!\n\n";
}

// Test query to list tables
$result = $conn->query("SHOW TABLES");
if ($result) {
    echo "Available tables:\n";
    while ($row = $result->fetch_array()) {
        echo "- " . $row[0] . "\n";
    }
} else {
    echo "Error listing tables: " . $conn->error;
}

// Test users table
$result = $conn->query("SELECT COUNT(*) as count FROM users");
if ($result) {
    $row = $result->fetch_assoc();
    echo "\nNumber of users: " . $row['count'] . "\n";
} else {
    echo "\nError querying users: " . $conn->error;
}

// Test GMUs table
$result = $conn->query("SELECT COUNT(*) as count FROM gmus");
if ($result) {
    $row = $result->fetch_assoc();
    echo "Number of GMUs: " . $row['count'] . "\n";
} else {
    echo "\nError querying GMUs: " . $conn->error;
}

// Close connection
$conn->close();
?>
