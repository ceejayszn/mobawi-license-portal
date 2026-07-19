<?php
require_once __DIR__ . '/../config.php';
requireLogin();

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        $name = trim($_POST['name'] ?? '');
        $package_name = trim($_POST['package_name'] ?? '');
        $platform = $_POST['platform'] ?? '';
        
        $stmt = $db->prepare('INSERT INTO applications (name, package_name, platform) VALUES (?, ?, ?)');
        try {
            $stmt->execute([$name, $package_name, $platform]);
            logAudit('CREATE_APPLICATION', 'application', $db->lastInsertId());
            $success = "Application created successfully.";
        } catch (PDOException $e) {
            $error = "Failed to create application. Package name must be unique.";
        }
    } elseif ($action === 'delete') {
        $id = $_POST['id'] ?? 0;
        $stmt = $db->prepare('DELETE FROM applications WHERE id = ?');
        $stmt->execute([$id]);
        logAudit('DELETE_APPLICATION', 'application', $id);
        $success = "Application deleted.";
    } elseif ($action === 'disable') {
        $id = $_POST['id'] ?? 0;
        $stmt = $db->prepare("UPDATE applications SET status = 'Disabled' WHERE id = ?");
        $stmt->execute([$id]);
        logAudit('DISABLE_APPLICATION', 'application', $id);
        $success = "Application disabled.";
    }
}

$applications = $db->query("SELECT * FROM applications ORDER BY id DESC")->fetchAll();

$title = "Applications - Mobawi License Portal";
ob_start();
?>
<div class="card">
    <h2>NEW APPLICATION</h2>
    <form method="POST" action="/applications" style="display:flex; flex-direction:row; align-items:flex-end; max-width:none;">
        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
        <input type="hidden" name="action" value="create">
        <div style="flex:1;">
            <label>Name</label>
            <input type="text" name="name" required placeholder="Mobawi Desktop">
        </div>
        <div style="flex:1;">
            <label>Package Name</label>
            <input type="text" name="package_name" required placeholder="com.mobawi.desktop">
        </div>
        <div style="flex:1;">
            <label>Platform</label>
            <select name="platform">
                <option value="Windows">Windows</option>
                <option value="Flutter">Flutter</option>
                <option value="Android">Android</option>
                <option value="Desktop">Desktop</option>
            </select>
        </div>
        <div>
            <button type="submit">CREATE</button>
        </div>
    </form>
</div>

<h2>REGISTERED APPLICATIONS</h2>
<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Package</th>
            <th>Platform</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($applications as $app): ?>
        <tr>
            <td><?= $app['id'] ?></td>
            <td><?= htmlspecialchars($app['name']) ?></td>
            <td><?= htmlspecialchars($app['package_name']) ?></td>
            <td><?= htmlspecialchars($app['platform']) ?></td>
            <td><?= $app['status'] ?></td>
            <td><?= $app['created_at'] ?></td>
            <td>
                <form method="POST" style="display:inline; max-width:none;" onsubmit="return confirm('Are you sure?');">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="id" value="<?= $app['id'] ?>">
                    <?php if ($app['status'] === 'Active'): ?>
                    <button type="submit" name="action" value="disable" style="padding: 2px 6px; font-size: 12px;">Disable</button>
                    <?php endif; ?>
                    <button type="submit" name="action" value="delete" style="padding: 2px 6px; font-size: 12px; color: var(--error-color); border-color: var(--error-color);">Delete</button>
                </form>
            </td>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<?php
$content = ob_get_clean();
require __DIR__ . '/layout.php';
