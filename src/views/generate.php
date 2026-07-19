<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../crypto.php';
requireLogin();

$db = getDB();

$generatedLicense = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    
    $application_id = (int)$_POST['application_id'];
    $device_fingerprint = trim($_POST['device_fingerprint'] ?? '');
    $type = $_POST['type'] ?? '30 Days';
    $status = $_POST['status'] ?? 'Active';
    
    // Calculate Expiry
    $issueDate = date('Y-m-d H:i:s');
    $durationMap = [
        '1 Hour' => '+1 hour',
        '24 Hours' => '+24 hours',
        '7 Days' => '+7 days',
        '30 Days' => '+30 days',
        '90 Days' => '+90 days',
        '180 Days' => '+180 days',
        '365 Days' => '+365 days',
        'Lifetime' => '+100 years'
    ];
    
    $expiryStr = $durationMap[$type] ?? '+30 days';
    $expiryDate = date('Y-m-d H:i:s', strtotime($expiryStr));
    
    if (!$application_id || !$device_fingerprint) {
        $error = "Application and Device Fingerprint are required.";
    } else {
        try {
            $licenseData = generate_license_payload(
                $application_id, 
                $device_fingerprint, 
                $issueDate, 
                $expiryDate, 
                $type, 
                $status
            );
            
            $stmt = $db->prepare('INSERT INTO licenses (application_id, device_fingerprint, issue_date, expiry_date, type, status, salt, signature, payload, generated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $application_id,
                $device_fingerprint,
                $issueDate,
                $expiryDate,
                $type,
                $status,
                $licenseData['salt'],
                $licenseData['signature'],
                $licenseData['human_code'],
                $_SESSION['user_id']
            ]);
            
            $licenseId = $db->lastInsertId();
            logAudit('GENERATE_LICENSE', 'license', $licenseId);
            
            $success = "License generated successfully.";
            $generatedLicense = [
                'code' => $licenseData['human_code'],
                'blob' => $licenseData['license_blob'],
                'issue' => $issueDate,
                'expiry' => $expiryDate
            ];
            
        } catch (Exception $e) {
            $error = "Failed to generate license: " . $e->getMessage();
        }
    }
}

$applications = $db->query("SELECT id, name, platform FROM applications WHERE status = 'Active'")->fetchAll();

$title = "Generate License - Mobawi License Portal";
ob_start();
?>
<div style="display:flex; gap: 20px;">
    <div class="card" style="flex: 1;">
        <h2>GENERATE OFFLINE LICENSE</h2>
        <form method="POST" action="/generate" style="max-width:none;">
            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
            
            <div>
                <label>Application</label>
                <select name="application_id" required>
                    <option value="">-- Select Application --</option>
                    <?php foreach ($applications as $app): ?>
                    <option value="<?= $app['id'] ?>"><?= htmlspecialchars($app['name']) ?> (<?= htmlspecialchars($app['platform']) ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div>
                <label>Device Fingerprint (SHA-256)</label>
                <input type="text" name="device_fingerprint" required placeholder="e.g. 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8">
            </div>
            
            <div>
                <label>Duration</label>
                <select name="type">
                    <option value="1 Hour">1 Hour</option>
                    <option value="24 Hours">24 Hours</option>
                    <option value="7 Days">7 Days</option>
                    <option value="30 Days" selected>30 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="180 Days">180 Days</option>
                    <option value="365 Days">365 Days</option>
                    <option value="Lifetime">Lifetime</option>
                </select>
            </div>
            
            <div>
                <label>Status</label>
                <select name="status">
                    <option value="Active" selected>Active</option>
                    <option value="Trial">Trial</option>
                </select>
            </div>
            
            <button type="submit">GENERATE LICENSE</button>
        </form>
    </div>
    
    <?php if ($generatedLicense): ?>
    <div class="card" style="flex: 1;">
        <h2>GENERATED LICENSE DETAILS</h2>
        
        <div>
            <label>Activation Code (Identifier)</label>
            <div class="mono-block" style="font-size: 1.5rem; color: var(--success-color);"><?= htmlspecialchars($generatedLicense['code']) ?></div>
        </div>
        
        <div style="margin-top: 15px;">
            <label>Offline License Blob (JSON + Signature Base64)</label>
            <div class="mono-block" id="licenseBlob"><?= htmlspecialchars($generatedLicense['blob']) ?></div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('licenseBlob').innerText); alert('Copied to clipboard');" style="margin-top: 10px;">COPY BLOB</button>
        </div>
        
        <div style="margin-top: 15px;">
            <p><strong>Issue Date:</strong> <?= $generatedLicense['issue'] ?></p>
            <p><strong>Expiry Date:</strong> <?= $generatedLicense['expiry'] ?></p>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php
$content = ob_get_clean();
require __DIR__ . '/layout.php';
