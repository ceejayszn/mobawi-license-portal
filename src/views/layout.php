<?php
// Base layout for all views
$title = $title ?? 'Mobawi License Portal';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title) ?></title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <h1>MOBAWI<span style="color:#555">_</span>LICENSE<span style="color:#555">_</span>PORTAL</h1>
            </div>
            <?php if (isLoggedIn()): ?>
            <nav>
                <a href="/dashboard" class="<?= $path === 'dashboard' ? 'active' : '' ?>">[ Dashboard ]</a>
                <a href="/applications" class="<?= $path === 'applications' ? 'active' : '' ?>">[ Applications ]</a>
                <a href="/generate" class="<?= $path === 'generate' ? 'active' : '' ?>">[ Generate ]</a>
                <a href="/records" class="<?= $path === 'records' ? 'active' : '' ?>">[ Records ]</a>
                <a href="/settings" class="<?= $path === 'settings' ? 'active' : '' ?>">[ Settings ]</a>
                <a href="/logout">[ Logout ]</a>
            </nav>
            <?php endif; ?>
        </header>

        <main>
            <?php if (isset($error)): ?>
                <div class="alert alert-error">ERROR: <?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            
            <?php if (isset($success)): ?>
                <div class="alert alert-success">SUCCESS: <?= htmlspecialchars($success) ?></div>
            <?php endif; ?>

            <?= $content ?? '' ?>
        </main>
    </div>
</body>
</html>
