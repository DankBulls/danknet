-- Create database (if your hosting allows)
-- CREATE DATABASE IF NOT EXISTS danknet_db;
-- USE danknet_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GMU table
CREATE TABLE IF NOT EXISTS gmus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gmu_number VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    description TEXT,
    boundaries TEXT,
    terrain_type VARCHAR(50)
);

-- Animal Sightings table
CREATE TABLE IF NOT EXISTS sightings (
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
);

-- Weather Data table
CREATE TABLE IF NOT EXISTS weather_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gmu_id INT,
    temperature DECIMAL(5,2),
    precipitation DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    humidity INT,
    recorded_at TIMESTAMP,
    FOREIGN KEY (gmu_id) REFERENCES gmus(id)
);

-- Analysis Results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gmu_id INT,
    species VARCHAR(50),
    probability DECIMAL(5,2),
    conditions_score INT,
    movement_prediction TEXT,
    analyzed_at TIMESTAMP,
    FOREIGN KEY (gmu_id) REFERENCES gmus(id)
);

-- Hunts table
CREATE TABLE IF NOT EXISTS hunts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    gmu_id VARCHAR(10) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    animal_type VARCHAR(50) NOT NULL,
    weapon_type VARCHAR(50) NOT NULL,
    weather_conditions JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Harvests table
CREATE TABLE IF NOT EXISTS harvests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hunt_id INT,
    lat DECIMAL(9,6) NOT NULL,
    lon DECIMAL(9,6) NOT NULL,
    elevation DECIMAL(8,2) NOT NULL,
    time_of_day VARCHAR(20) NOT NULL,
    distance_meters INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hunt_id) REFERENCES hunts(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_hunts_user ON hunts(user_id);
CREATE INDEX IF NOT EXISTS idx_hunts_gmu ON hunts(gmu_id);
CREATE INDEX IF NOT EXISTS idx_hunts_animal ON hunts(animal_type);
CREATE INDEX IF NOT EXISTS idx_hunts_date ON hunts(start_date);
CREATE INDEX IF NOT EXISTS idx_harvests_hunt ON harvests(hunt_id);
CREATE INDEX IF NOT EXISTS idx_harvests_location ON harvests (lat, lon);

-- Insert sample data

-- Sample users (password is 'test123' for all users)
INSERT INTO users (username, password_hash, email, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@dankbulls.com', 'admin'),
('hunter1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hunter1@example.com', 'user'),
('hunter2', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hunter2@example.com', 'user');

-- Sample GMUs
INSERT INTO gmus (gmu_number, name, description, terrain_type) VALUES
('12', 'North Fork', 'Mountainous region with dense forest cover', 'mountain'),
('23', 'South Valley', 'Rolling hills and open meadows', 'valley'),
('34', 'East Ridge', 'Mixed terrain with steep ridges', 'ridge'),
('45', 'West Basin', 'Desert basin with scattered vegetation', 'basin');

-- Sample sightings
INSERT INTO sightings (gmu_id, species, latitude, longitude, user_id, notes, sighting_date) VALUES
(1, 'Elk', 40.7128, -74.0060, 1, 'Large herd spotted near water source', NOW()),
(1, 'Mule Deer', 40.7129, -74.0061, 2, 'Two bucks feeding in meadow', NOW()),
(2, 'Elk', 40.7130, -74.0062, 2, 'Fresh tracks and droppings', NOW()),
(3, 'Bighorn Sheep', 40.7131, -74.0063, 3, 'Group of 5 on ridge', NOW());

-- Sample weather data
INSERT INTO weather_data (gmu_id, temperature, precipitation, wind_speed, humidity, recorded_at) VALUES
(1, 65.5, 0.0, 5.2, 45, NOW()),
(2, 70.2, 0.1, 8.5, 50, NOW()),
(3, 62.8, 0.0, 12.3, 40, NOW()),
(4, 75.0, 0.0, 6.8, 35, NOW());

-- Sample analysis results
INSERT INTO analysis_results (gmu_id, species, probability, conditions_score, movement_prediction, analyzed_at) VALUES
(1, 'Elk', 85.5, 90, 'High activity expected in early morning', NOW()),
(2, 'Mule Deer', 75.2, 85, 'Active throughout the day', NOW()),
(3, 'Bighorn Sheep', 65.8, 70, 'Moving to lower elevation', NOW()),
(4, 'Elk', 55.0, 60, 'Limited movement due to heat', NOW());
