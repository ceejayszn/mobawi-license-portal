<?php
// Core router
require_once __DIR__ . '/../src/config.php';

// Check if PHP sodium is loaded
if (!extension_loaded('sodium')) {
    die("Error: The 'sodium' extension is required for Ed25519 cryptography. Please enable it in your php.ini.");
}

// Basic router
$routes = [
    'login' => 'login.php',
    'logout' => 'logout.php',
    'dashboard' => 'dashboard.php',
    'applications' => 'applications.php',
    'generate' => 'generate.php',
    'records' => 'records.php',
    'settings' => 'settings.php'
];

if (array_key_exists($path, $routes)) {
    $file = __DIR__ . '/../src/views/' . $routes[$path];
    if (file_exists($file)) {
        require $file;
    } else {
        http_response_code(404);
        echo "404 - View not found";
    }
} else {
    http_response_code(404);
    echo "404 - Page not found";
}
