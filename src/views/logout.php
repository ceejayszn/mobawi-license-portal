<?php
require_once __DIR__ . '/../config.php';

if (isLoggedIn()) {
    logAudit('LOGOUT');
    session_destroy();
}

header('Location: /login');
exit;
