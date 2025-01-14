<?php
require_once '../config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }

    $user_id = $_GET['user_id'];

    // Get sightings count
    $sql = "SELECT COUNT(*) as count FROM sightings WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $sightings = $stmt->get_result()->fetch_assoc()['count'];

    // Get analyses count
    $sql = "SELECT COUNT(*) as count FROM analysis_results ar 
            JOIN sightings s ON ar.gmu_id = s.gmu_id 
            WHERE s.user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $analyses = $stmt->get_result()->fetch_assoc()['count'];

    // Get predictions (analyses with probability > 70)
    $sql = "SELECT COUNT(*) as count FROM analysis_results ar 
            JOIN sightings s ON ar.gmu_id = s.gmu_id 
            WHERE s.user_id = ? AND ar.probability > 70";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $predictions = $stmt->get_result()->fetch_assoc()['count'];

    echo json_encode([
        'sightings' => (int)$sightings,
        'analyses' => (int)$analyses,
        'predictions' => (int)$predictions
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
