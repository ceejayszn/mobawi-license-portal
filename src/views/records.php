<?php
require_once __DIR__ . '/../config.php';
requireLogin();

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';
    $id = $_POST['id'] ?? 0;

    if ($action === 'revoke') {
        $stmt = $db->prepare("UPDATE licenses SET status = 'Revoked' WHERE id = ?");
        $stmt->execute([$id]);
        logAudit('REVOKE_LICENSE', 'license', $id);
        $success = "License revoked.";
    } elseif ($action === 'suspend') {
        $stmt = $db->prepare("UPDATE licenses SET status = 'Suspended' WHERE id = ?");
        $stmt->execute([$id]);
        logAudit('SUSPEND_LICENSE', 'license', $id);
        $success = "License suspended.";
    } elseif ($action === 'delete') {
        $stmt = $db->prepare("DELETE FROM licenses WHERE id = ?");
        $stmt->execute([$id]);
        logAudit('DELETE_LICENSE', 'license', $id);
        $success = "License deleted.";
    }
}

// Search and Filter
$search = $_GET['search'] ?? '';
$filter_status = $_GET['status'] ?? '';

$query = "SELECT l.*, a.name as app_name, u.username as generated_by_name 
          FROM licenses l 
          JOIN applications a ON l.application_id = a.id 
          LEFT JOIN users u ON l.generated_by = u.id 
          WHERE 1=1";
$params = [];

if ($search) {
    $query .= " AND (l.payload LIKE ? OR l.device_fingerprint LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filter_status) {
    $query .= " AND l.status = ?";
    $params[] = $filter_status;
}

$query .= " ORDER BY l.id DESC LIMIT 100";
$stmt = $db->prepare($query);
$stmt->execute($params);
$licenses = $stmt->fetchAll();

$title = "License Records - Mobawi License Portal";
ob_start();
?>
<h2>LICENSE RECORDS</h2>

<div class="card">
    <form method="GET" action="/records" style="display:flex; flex-direction:row; max-width:none;">
        <div style="flex:2;">
            <input type="text" name="search" placeholder="Search by Code or Device Fingerprint" value="<?= htmlspecialchars($search) ?>">
        </div>
        <div style="flex:1;">
            <select name="status">
                <option value="">All Statuses</option>
                <option value="Active" <?= $filter_status === 'Active' ? 'selected' : '' ?>>Active</option>
                <option value="Trial" <?= $filter_status === 'Trial' ? 'selected' : '' ?>>Trial</option>
                <option value="Suspended" <?= $filter_status === 'Suspended' ? 'selected' : '' ?>>Suspended</option>
                <option value="Revoked" <?= $filter_status === 'Revoked' ? 'selected' : '' ?>>Revoked</option>
            </select>
        </div>
        <div>
            <button type="submit">FILTER</button>
        </div>
    </form>
</div>

<div style="overflow-x: auto;">
    <table>
        <thead>
            <tr>
                <th>License Code</th>
                <th>Application</th>
                <th>Device ID</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($licenses as $l): ?>
            <tr>
                <td><?= htmlspecialchars($l['payload']) ?></td>
                <td><?= htmlspecialchars($l['app_name']) ?></td>
                <td title="<?= htmlspecialchars($l['device_fingerprint']) ?>">
                    <?= substr(htmlspecialchars($l['device_fingerprint']), 0, 16) ?>...
                </td>
                <td><?= $l['expiry_date'] ?></td>
                <td style="color: <?= $l['status'] === 'Active' ? 'var(--success-color)' : ($l['status'] === 'Revoked' ? 'var(--error-color)' : 'inherit') ?>">
                    <?= $l['status'] ?>
                </td>
                <td><?= htmlspecialchars($l['generated_by_name'] ?? 'System') ?></td>
                <td>
                    <form method="POST" style="display:inline; max-width:none;" onsubmit="return confirm('Are you sure?');">
                        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                        <input type="hidden" name="id" value="<?= $l['id'] ?>">
                        <?php if ($l['status'] === 'Active'): ?>
                            <button type="submit" name="action" value="suspend" style="padding: 2px 6px; font-size: 12px;">Suspend</button>
                            <button type="submit" name="action" value="revoke" style="padding: 2px 6px; font-size: 12px; color: var(--error-color); border-color: var(--error-color);">Revoke</button>
                        <?php endif; ?>
                        <button type="submit" name="action" value="delete" style="padding: 2px 6px; font-size: 12px; color: var(--error-color); border-color: var(--error-color);">Del</button>
                    </form>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<?php
$content = ob_get_clean();
require __DIR__ . '/layout.php';
