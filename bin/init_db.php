<?php
// Script to initialize the SQLite database and create a default admin user.

$dbPath = __DIR__ . '/../database/database.sqlite';
$schemaPath = __DIR__ . '/../database/schema.sql';

if (file_exists($dbPath)) {
    echo "Database already exists at $dbPath. Delete it first if you want to recreate it.\n";
    exit(1);
}

try {
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Read and execute schema
    $schema = file_get_contents($schemaPath);
    $db->exec($schema);
    echo "Schema created successfully.\n";

    // Create default root user (root / kali)
    $passwordRoot = 'kali';
    $hashRoot = password_hash($passwordRoot, PASSWORD_ARGON2I);
    
    $stmt = $db->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    $stmt->execute(['root', $hashRoot]);
    
    echo "Default user created.\n";
    echo "Username: root, Password: $passwordRoot\n";
    echo "Database initialization complete.\n";

} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
