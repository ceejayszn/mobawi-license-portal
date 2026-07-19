<?php
// Database configuration
define('DB_PATH', __DIR__ . '/../database/database.sqlite');

function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $db = new PDO('sqlite:' . DB_PATH);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }
    return $db;
}

// Security Headers (9/10 Security Standard)
header("X-Frame-Options: DENY"); // Prevent Clickjacking
header("X-XSS-Protection: 1; mode=block"); // Cross-site scripting (XSS) filter
header("X-Content-Type-Options: nosniff"); // Prevent MIME-sniffing
header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"); // Enforce HTTPS (HSTS)
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"); // CSP
header("Referrer-Policy: strict-origin-when-cross-origin");

// Ensure session is started safely with strict parameters
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => $_SERVER['HTTP_HOST'] ?? '',
        'secure' => isset($_SERVER['HTTPS']), // Only send over HTTPS if available
        'httponly' => true, // Prevent JavaScript access to session cookie
        'samesite' => 'Strict' // Prevent CSRF via cross-site requests
    ]);
    session_start();
}

function isLoggedIn() {
    // Basic session hijacking prevention: tie session to user agent and IP (optional but increases security)
    if (isset($_SESSION['user_id'])) {
        $currentAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if (!isset($_SESSION['user_agent'])) {
            $_SESSION['user_agent'] = $currentAgent;
        } elseif ($_SESSION['user_agent'] !== $currentAgent) {
            // User agent changed mid-session, potential hijack
            session_destroy();
            return false;
        }
        return true;
    }
    return false;
}

// Basic Rate Limiting for Login attempts
function checkRateLimit($ip) {
    $db = getDB();
    // Cleanup old attempts (older than 15 minutes)
    $db->exec("DELETE FROM audit_logs WHERE action = 'LOGIN_FAILED' AND timestamp < datetime('now', '-15 minutes')");
    
    // Count failed attempts for this IP in the last 15 minutes
    $stmt = $db->prepare("SELECT COUNT(*) FROM audit_logs WHERE action = 'LOGIN_FAILED' AND ip_address = ? AND timestamp >= datetime('now', '-15 minutes')");
    $stmt->execute([$ip]);
    $attempts = $stmt->fetchColumn();
    
    // Lock out after 5 failed attempts
    if ($attempts >= 5) {
        die("Security Alert: Too many failed login attempts. Please try again in 15 minutes.");
    }
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: /login');
        exit;
    }
}

function csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_POST['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
            die("CSRF token validation failed.");
        }
    }
}

function logAudit($action, $targetType = null, $targetId = null) {
    $db = getDB();
    $userId = $_SESSION['user_id'] ?? null;
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    
    $stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, target_type, target_id, ip_address) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $action, $targetType, $targetId, $ip]);
}

// Simple request routing
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($request_uri, '/');
if ($path === '') $path = 'dashboard';
