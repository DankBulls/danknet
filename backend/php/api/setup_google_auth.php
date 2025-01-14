<?php
require_once '../config.php';

// Add google_id and picture columns to users table if they don't exist
$sql = "ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
        ADD COLUMN IF NOT EXISTS picture VARCHAR(255),
        MODIFY COLUMN password_hash VARCHAR(255) NULL";

if ($conn->query($sql) === TRUE) {
    echo "Table users modified successfully\n";
} else {
    echo "Error modifying table: " . $conn->error . "\n";
}

// Set up dankbulls@gmail.com as admin
$sql = "INSERT INTO users (email, username, role, google_id) 
        VALUES ('dankbulls@gmail.com', 'dankbulls', 'admin', NULL)
        ON DUPLICATE KEY UPDATE role = 'admin'";

if ($conn->query($sql) === TRUE) {
    echo "Admin user set up successfully\n";
} else {
    echo "Error setting up admin: " . $conn->error . "\n";
}

?>
