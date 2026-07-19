<?php
require_once __DIR__ . '/../config.php';
requireLogin();

$db = getDB();

$stats = [
    'Total Applications' => $db->query('SELECT COUNT(*) FROM applications')->fetchColumn(),
    'Total Licenses' => $db->query('SELECT COUNT(*) FROM licenses')->fetchColumn(),
    'Today\'s Licenses' => $db->query("SELECT COUNT(*) FROM licenses WHERE date(created_at) = date('now')")->fetchColumn(),
    'Active Licenses' => $db->query("SELECT COUNT(*) FROM licenses WHERE status = 'Active'")->fetchColumn(),
    'Expired Licenses' => $db->query("SELECT COUNT(*) FROM licenses WHERE expiry_date < datetime('now')")->fetchColumn(),
    'Revoked Licenses' => $db->query("SELECT COUNT(*) FROM licenses WHERE status = 'Revoked'")->fetchColumn(),
    'Suspended Licenses' => $db->query("SELECT COUNT(*) FROM licenses WHERE status = 'Suspended'")->fetchColumn(),
];

$title = "Dashboard - Mobawi License Portal";
ob_start();
?>
<h2>SYSTEM DASHBOARD</h2>

<div class="stats-grid">
    <?php foreach ($stats as $label => $value): ?>
    <div class="stat-box">
        <div><?= htmlspecialchars($label) ?></div>
        <div class="stat-value"><?= (int)$value ?></div>
    </div>
    <?php endforeach; ?>
</div>

<?php
$content = ob_get_clean();
require __DIR__ . '/layout.php';
