<?php
require_once 'config.php';

// Array of SQL statements to create tables
$sql_statements = [
    // Users table
    "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    // GMU table
    "CREATE TABLE IF NOT EXISTS gmus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gmu_number VARCHAR(10) NOT NULL,
        name VARCHAR(100),
        description TEXT,
        boundaries TEXT,
        terrain_type VARCHAR(50)
    )",

    // Animal Sightings table
    "CREATE TABLE IF NOT EXISTS sightings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gmu_id INT,
        species VARCHAR(50),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        sighting_date TIMESTAMP,
        user_id INT,
        notes TEXT,
        FOREIGN KEY (gmu_id) REFERENCES gmus(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )",

    // Weather Data table
    "CREATE TABLE IF NOT EXISTS weather_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gmu_id INT,
        temperature DECIMAL(5,2),
        precipitation DECIMAL(5,2),
        wind_speed DECIMAL(5,2),
        humidity INT,
        recorded_at TIMESTAMP,
        FOREIGN KEY (gmu_id) REFERENCES gmus(id)
    )",

    // Analysis Results table
    "CREATE TABLE IF NOT EXISTS analysis_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gmu_id INT,
        species VARCHAR(50),
        probability DECIMAL(5,2),
        conditions_score INT,
        movement_prediction TEXT,
        analyzed_at TIMESTAMP,
        FOREIGN KEY (gmu_id) REFERENCES gmus(id)
    )",

    // Insert test admin user
    "INSERT INTO users (username, password_hash, email, role) 
     VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
             'admin@dankbulls.com', 'admin')
     ON DUPLICATE KEY UPDATE username=username",

    // Insert sample GMU
    "INSERT INTO gmus (gmu_number, name, description, terrain_type) 
     VALUES ('12', 'North Fork', 'Mountainous region with dense forest cover', 'mountain')
     ON DUPLICATE KEY UPDATE gmu_number=gmu_number"
];

// Execute each SQL statement
foreach ($sql_statements as $sql) {
    if ($conn->query($sql) === TRUE) {
        echo "Success: " . substr($sql, 0, 50) . "...\n";
    } else {
        echo "Error: " . $conn->error . "\n";
    }
}

echo "\nDatabase setup complete!";

// Close connection
$conn->close();
?>
