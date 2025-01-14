<?php
require_once '../config.php';

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['gmu_id'])) {
        // Get sightings for specific GMU
        $sql = "SELECT s.*, u.username 
                FROM sightings s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.gmu_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $_GET['gmu_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $sightings = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($sightings);
    } else {
        // Get all sightings
        $sql = "SELECT s.*, u.username 
                FROM sightings s 
                JOIN users u ON s.user_id = u.id";
        $result = $conn->query($sql);
        $sightings = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode($sightings);
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $sql = "INSERT INTO sightings (gmu_id, species, latitude, longitude, user_id, notes) 
            VALUES (?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isddis", 
        $data['gmu_id'],
        $data['species'],
        $data['latitude'],
        $data['longitude'],
        $data['user_id'],
        $data['notes']
    );
    
    if ($stmt->execute()) {
        $data['id'] = $conn->insert_id;
        echo json_encode($data);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create sighting']);
    }
}
?>
