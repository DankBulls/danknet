-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    name VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    profile_picture VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    invitation_code VARCHAR(32) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY unique_email (email),
    UNIQUE KEY unique_code (invitation_code)
);

-- Create initial admin user (dankbulls@gmail.com)
INSERT INTO users (email, name, role, created_at) 
VALUES ('dankbulls@gmail.com', 'DankBulls Admin', 'admin', NOW())
ON DUPLICATE KEY UPDATE role = 'admin';
