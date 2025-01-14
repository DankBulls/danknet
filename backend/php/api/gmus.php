<?php
require_once '../config.php';

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        // Get specific GMU
        $sql = "SELECT * FROM gmus WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $_GET['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $gmu = $result->fetch_assoc();
        
        if ($gmu) {
            echo json_encode($gmu);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'GMU not found']);
        }
    } else {
        // Get all GMUs
        $sql = "SELECT * FROM gmus";
        $result = $conn->query($sql);
        $gmus = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($gmus);
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $sql = "INSERT INTO gmus (gmu_number, name, description, boundaries, terrain_type) 
            VALUES (?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssss", 
        $data['gmu_number'],
        $data['name'],
        $data['description'],
        $data['boundaries'],
        $data['terrain_type']
    );
    
    if ($stmt->execute()) {
        $data['id'] = $conn->insert_id;
        echo json_encode($data);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create GMU']);
    }
}
?>
