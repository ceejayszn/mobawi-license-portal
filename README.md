# Mobawi License Portal

A production-ready offline license management portal for generating Ed25519-signed licenses.

## Project Architecture

This project is built using a classic LAMP/LEMP style setup:
- **Frontend**: HTML5, CSS3, Minimal Vanilla JS
- **Backend**: PHP 8.x
- **Database**: SQLite
- **Cryptography**: Libsodium (Ed25519)

### Directory Structure
- `public/`: Web root directory (contains `index.php` router, CSS, JS).
- `src/`: Core application logic (config, crypto, routing).
- `src/views/`: HTML/PHP templates for the UI.
- `database/`: SQLite database storage and schema.
- `bin/`: CLI scripts (like `init_db.php`).

## Installation & Running Locally

1. **Requirements**: 
   - PHP 8.0+
   - SQLite extension enabled (`pdo_sqlite`).
   - Sodium extension enabled (`sodium`).

2. **Initialize Database**:
   Run the initialization script to create the SQLite database and the default admin user:
   ```bash
   php bin/init_db.php
   ```
   *Default Credentials:*
   - Username: `admin`
   - Password: `admin123`

3. **Start Development Server**:
   You can use PHP's built-in web server for local development. Run this from the project root:
   ```bash
   cd public
   php -S localhost:8000
   ```
   Then navigate to `http://localhost:8000` in your browser.

## Running in Production

- Point your web server's (Nginx/Apache) document root to the `/public` directory.
- Ensure the `/database` folder is writable by the web server user (e.g., `www-data`).
- **NEVER** expose the `/src`, `/database`, or `/bin` directories to the public web.
- Ensure HTTPS is enforced.
- **IMPORTANT**: Change the default admin password immediately after deployment.

## License Generation Workflow

1. Register an application in the **Applications** tab.
2. An end-user provides a hardware-based Device Fingerprint (SHA-256).
3. Navigate to **Generate**, select the Application, enter the Fingerprint, and select the Duration.
4. The system will create an Ed25519-signed JSON payload.
5. The system generates a compact Human Code (e.g. `MBW7-KP2Q...`) and a Base64 Signed JSON Blob.
6. Provide the Blob to the offline application for verification.

## Public/Private Key Management

- Ed25519 keypairs are generated automatically on first run.
- The **Private Key** is kept entirely on the server and is never exposed in the UI.
- The **Public Key** can be exported from the **Settings** page. It must be embedded within the client applications to verify licenses offline.

## Security Considerations

- Passwords are hashed using **Argon2i**.
- All state-changing forms use **CSRF Tokens**.
- All SQL queries use **PDO Prepared Statements** to prevent SQL injection.
- Cryptography strictly relies on `libsodium` (Ed25519 detached signatures).

## Backup and Restore Procedures

To backup the system, simply create a secure copy of the `database/database.sqlite` file.
To restore, replace the `database.sqlite` file with your backup copy. Ensure proper file permissions are maintained.
