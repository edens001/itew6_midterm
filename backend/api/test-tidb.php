<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$result = [
    'success' => false,
    'message' => '',
    'details' => []
];

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        $result['success'] = true;
        $result['message'] = 'Successfully connected to TiDB Cloud!';
        
        // Test query
        $stmt = $db->query("SELECT VERSION() as version");
        $version = $stmt->fetch(PDO::FETCH_ASSOC);
        $result['details']['version'] = $version['version'];
        
        // Check if users table exists
        $stmt = $db->query("SHOW TABLES LIKE 'users'");
        $result['details']['users_table_exists'] = ($stmt->rowCount() > 0);
        
    } else {
        $result['message'] = 'Failed to connect to TiDB Cloud';
    }
} catch (Exception $e) {
    $result['message'] = 'Error: ' . $e->getMessage();
    $result['details']['error'] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT);
?>