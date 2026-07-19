<?php
// Cryptographic functions using libsodium

/**
 * Encodes binary data to Base32 without padding (RFC 4648)
 * Using custom implementation as PHP doesn't have native base32 until 8.4+ sometimes
 */
function base32_encode($data) {
    if (empty($data)) return '';
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $binaryString = '';
    foreach (str_split($data) as $char) {
        $binaryString .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
    }
    $binaryString = str_pad($binaryString, ceil(strlen($binaryString) / 5) * 5, '0', STR_PAD_RIGHT);
    $base32 = '';
    foreach (str_split($binaryString, 5) as $chunk) {
        $base32 .= $alphabet[bindec($chunk)];
    }
    return $base32;
}

/**
 * Format string as XXXX-XXXX-XXXX-XXXX
 */
function format_license_key($str) {
    return implode('-', str_split($str, 4));
}

/**
 * Generate a new Ed25519 keypair
 */
function generate_keypair() {
    $keypair = sodium_crypto_sign_keypair();
    $secret_key = sodium_crypto_sign_secretkey($keypair);
    $public_key = sodium_crypto_sign_publickey($keypair);
    return [
        'private' => base64_encode($secret_key),
        'public' => base64_encode($public_key)
    ];
}

/**
 * Get or create system keypair
 */
function get_system_keypair() {
    $db = getDB();
    $stmt = $db->query("SELECT value FROM settings WHERE key = 'private_key'");
    $private = $stmt->fetchColumn();
    
    $stmt = $db->query("SELECT value FROM settings WHERE key = 'public_key'");
    $public = $stmt->fetchColumn();
    
    if (!$private || !$public) {
        $keys = generate_keypair();
        $stmt = $db->prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
        $stmt->execute(['private_key', $keys['private']]);
        $stmt->execute(['public_key', $keys['public']]);
        return $keys;
    }
    
    return [
        'private' => $private,
        'public' => $public
    ];
}

/**
 * Generate an offline license
 */
function generate_license_payload($appId, $deviceFingerprint, $issueDate, $expiryDate, $type, $status) {
    $keys = get_system_keypair();
    $privateKey = base64_decode($keys['private']);
    
    $salt = bin2hex(random_bytes(4));
    $version = "1";
    
    // Create the payload string to sign
    $payloadData = [
        'v' => $version,
        'app' => $appId,
        'dev' => $deviceFingerprint,
        'iss' => $issueDate,
        'exp' => $expiryDate,
        'typ' => $type,
        'st' => $status,
        'slt' => $salt
    ];
    $payloadJson = json_encode($payloadData);
    
    // Sign the payload
    $signature = sodium_crypto_sign_detached($payloadJson, $privateKey);
    
    // Compact format: Base32 of (hash(signature) + salt) to look clean, 
    // or just raw signature if we want full offline validation without passing the JSON.
    // For a short, human-friendly key, we combine a truncated hash with the payload in the DB,
    // and provide the full JSON + Signature to the app, OR we encode the whole thing.
    // Given the prompt: "Produce a human-friendly activation code grouped in blocks. MBW7-KP2Q..."
    // An Ed25519 signature is 64 bytes. Base32 encoded, that's 103 chars. That's too long.
    // So the license block itself is just an identifier that the application will use if it goes online? 
    // Wait, prompt says: "The application verify locally. Read Device Fingerprint. Read License. Verify Signature. Unlock. No internet required."
    // If it's completely offline, the license MUST contain the signature and payload.
    // A full Ed25519 signature + payload is large. 
    // We will generate a base64 string for the actual offline license file, and a short human-readable identifier for tracking.
    // Prompt: "Produce a human-friendly activation code grouped in blocks. Example format: MBW7-KP2Q-X91L-FG8D-HC5N"
    // We can generate this as a unique License ID, but the actual verify needs the full payload.
    // Or we encode the bare minimum: AppID(2b) + Expiry(4b) + DeviceHash(4b) + Sig(64b) = 74 bytes. Base32 = 119 chars.
    // We will create a `human_code` which is just a random 20 char string formatted, and a `license_blob` which contains the signed JSON.
    
    $humanCodeRaw = strtoupper(base32_encode(random_bytes(13))); // 13 bytes = ~21 chars
    $humanCode = substr(format_license_key($humanCodeRaw), 0, 24); // e.g. ABC1-DEF2-GHI3-JKL4-MNO5
    
    $finalLicenseFile = base64_encode(json_encode([
        'code' => $humanCode,
        'payload' => $payloadData,
        'sig' => base64_encode($signature)
    ]));

    return [
        'salt' => $salt,
        'signature' => base64_encode($signature),
        'human_code' => $humanCode,
        'license_blob' => $finalLicenseFile
    ];
}
