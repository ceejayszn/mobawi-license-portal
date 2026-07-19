<?php
require_once __DIR__ . '/../config.php';

if (isLoggedIn()) {
    header('Location: /dashboard');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    checkRateLimit($ip); // Enforce brute-force protection

    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    $db = getDB();
    $stmt = $db->prepare('SELECT id, password_hash FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        session_regenerate_id(true); // Prevent Session Fixation
        $_SESSION['user_id'] = $user['id'];
        logAudit('LOGIN_SUCCESS');
        header('Location: /dashboard');
        exit;
    } else {
        logAudit('LOGIN_FAILED');
        $error = "Invalid credentials.";
    }
}

$title = "Login - Mobawi License Portal";
ob_start();
?>
<div class="card" style="max-width: 400px; margin: 40px auto;">
    <h2>SYSTEM LOGIN</h2>
    <form method="POST" action="/login">
        <div>
            <label for="username">USERNAME</label>
            <input type="text" id="username" name="username" required autofocus>
        </div>
        <div>
            <label for="password">PASSWORD</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">AUTHORIZE</button>
    </form>
</div>
<?php
$content = ob_get_clean();
require __DIR__ . '/layout.php';
