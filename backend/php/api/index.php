<?php
// Simple API status check
header('Content-Type: application/json');
echo json_encode([
    'status' => 'online',
    'message' => 'DankNet API is running',
    'version' => '1.0.0',
    'timestamp' => date('Y-m-d H:i:s')
]);
