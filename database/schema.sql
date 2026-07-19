-- SQLite Database Schema for Mobawi License Portal

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    package_name TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL, -- e.g., 'Windows', 'Flutter', 'Desktop', 'Android'
    pub_key_id TEXT, -- To keep track of the embedded public key ID
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Disabled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    device_fingerprint TEXT NOT NULL,
    issue_date DATETIME NOT NULL,
    expiry_date DATETIME NOT NULL,
    type TEXT NOT NULL, -- '1 Hour', '24 Hours', '7 Days', '30 Days', '90 Days', '180 Days', '365 Days', 'Lifetime'
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Trial', 'Suspended', 'Revoked'
    salt TEXT NOT NULL,
    signature TEXT NOT NULL,
    payload TEXT NOT NULL, -- The final human-friendly block string (e.g. MBW7-KP2Q...)
    generated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(application_id) REFERENCES applications(id),
    FOREIGN KEY(generated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Default settings could be added here if needed
-- INSERT OR IGNORE INTO settings (key, value) VALUES ('license_format', 'MBW7-KP2Q-X91L-FG8D-HC5N');
