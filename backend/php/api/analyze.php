<?php
require_once '../config.php';

function calculateHuntingScore($gmuId, $species) {
    global $conn;
    
    // Get weather data
    $sql = "SELECT temperature, precipitation, wind_speed, humidity 
            FROM weather_data 
            WHERE gmu_id = ? 
            ORDER BY recorded_at DESC LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $gmuId);
    $stmt->execute();
    $result = $stmt->get_result();
    $weather = $result->fetch_assoc();
    
    // Calculate score based on conditions
    $score = 0;
    if ($weather) {
        // Temperature score
        if ($weather['temperature'] >= 40 && $weather['temperature'] <= 70) {
            $score += 25;
        }
        
        // Wind score
        if ($weather['wind_speed'] < 15) {
            $score += 25;
        }
        
        // Humidity score
        if ($weather['humidity'] >= 30 && $weather['humidity'] <= 70) {
            $score += 25;
        }
        
        // Precipitation score
        if ($weather['precipitation'] < 0.5) {
            $score += 25;
        }
    }
    
    return $score;
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $gmuId = isset($_GET['gmu_id']) ? $_GET['gmu_id'] : null;
    $species = isset($_GET['species']) ? $_GET['species'] : null;
    
    if (!$gmuId || !$species) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters']);
        exit();
    }
    
    $score = calculateHuntingScore($gmuId, $species);
    
    // Get recent sightings
    $sql = "SELECT latitude, longitude, sighting_date 
            FROM sightings 
            WHERE gmu_id = ? AND species = ? 
            ORDER BY sighting_date DESC LIMIT 5";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $gmuId, $species);
    $stmt->execute();
    $result = $stmt->get_result();
    $sightings = $result->fetch_all(MYSQLI_ASSOC);
    
    $response = [
        'hunting_score' => $score,
        'recent_sightings' => $sightings,
        'recommendation' => $score >= 75 ? 'Excellent hunting conditions' : 
                          ($score >= 50 ? 'Good hunting conditions' : 
                          'Poor hunting conditions')
    ];
    
    echo json_encode($response);
}
?>
