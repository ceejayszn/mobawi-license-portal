<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../crypto.php';
requireLogin();

$db = getDB();
$keys = get_system_keypair();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'change_password') {
        $old = $_POST['old_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        
        $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
        $stmt->execute([$_SESSION['user_id']]);
        $hash = $stmt->fetchColumn();
        
        if (password_verify($old, $hash)) {
            $newHash = password_hash($new, PASSWORD_ARGON2I);
            $stmt = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $stmt->execute([$newHash, $_SESSION['user_id']]);
            logAudit('CHANGE_PASSWORD');
            $success = "Password changed successfully.";
        } else {
            $error = "Incorrect old password.";
        }
    }
}

// Fetch recent audit logs
$logs = $db->query("SELECT a.*, u.username FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.id DESC LIMIT 20")->fetchAll();

$title = "Settings & Audit - Mobawi License Portal";
ob_start();
?>
<div style="display:flex; gap: 20px;">
    <!-- System Keys -->
    <div class="card" style="flex: 1;">
        <h2>SYSTEM KEYS (Ed25519)</h2>
        <p>This public key MUST be embedded in your client applications.</p>
        
        <div style="margin-top:15px;">
            <label>Public Key (Base64)</label>
            <div class="mono-block" id="pubKey"><?= htmlspecialchars($keys['public']) ?></div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('pubKey').innerText); alert('Copied Public Key');" style="margin-top: 10px;">COPY PUBLIC KEY</button>
        </div>
        
        <div style="margin-top:15px;">
            <label>Private Key (Base64) - KEEP SECRET</label>
            <div class="mono-block" style="color: var(--error-color);">[ REDACTED FROM UI ]</div>
        </div>
    </div>
    
    <!-- Change Password -->
    <div class="card" style="flex: 1;">
        <h2>CHANGE PASSWORD</h2>
        <form method="POST" action="/settings" style="max-width:none;">
            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
            <input type="hidden" name="action" value="change_password">
            
            <div>
                <label>Old Password</label>
                <input type="password" name="old_password" required>
            </div>
            
            <div>
                <label>New Password</label>
                <input type="password" name="new_password" required>
            </div>
            
            <button type="submit">UPDATE PASSWORD</button>
        </form>
    </div>
</div>

<h2>RECENT AUDIT LOGS</h2>
<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Target Type</th>
            <th>Target ID</th>
            <th>IP Address</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($logs as $log): ?>
        <tr>
            <td><?= $log['id'] ?></td>
            <td><?= $log['timestamp'] ?></td>
            <td><?= htmlspecialchars($log['username'] ?? 'System') ?></td>
            <td><?= htmlspecialchars($log['action']) ?></td>
            <td><?= htmlspecialchars($log['target_type'] ?? '') ?></td>
            <td><?= htmlspecialchars($log['target_id'] ?? '') ?></td>
            <td><?= htmlspecialchars($log['ip_address'] ?? '') ?></td>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<?php
$content = ob_get_clean();
require __DIR__ . '/layout.php';
