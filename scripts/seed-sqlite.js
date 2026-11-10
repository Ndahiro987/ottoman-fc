const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const db = new Database(path.resolve(process.cwd(), "ottoman-fc.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.prepare(`CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS permissions (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, first_name TEXT, last_name TEXT, phone TEXT, role TEXT NOT NULL, is_active INTEGER DEFAULT 1, email_verified INTEGER DEFAULT 0, last_login_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS user_roles (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role_id TEXT NOT NULL, assigned_by TEXT, assigned_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(role_id) REFERENCES roles(id), UNIQUE(user_id, role_id))`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS role_permissions (id TEXT PRIMARY KEY, role_id TEXT NOT NULL, permission_id TEXT NOT NULL, FOREIGN KEY(role_id) REFERENCES roles(id), FOREIGN KEY(permission_id) REFERENCES permissions(id), UNIQUE(role_id, permission_id))`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT NOT NULL, expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`).run();

const uuid = () => crypto.randomUUID();

db.prepare(`INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING`).run(uuid(), "administrator", "Full system access");
db.prepare(`INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING`).run(uuid(), "coach", "Coaching and team management");
db.prepare(`INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING`).run(uuid(), "player", "Player portal access");

const perms = [
  "players.view", "players.create", "players.edit",
  "kyc.view", "kyc.review",
  "contracts.view", "contracts.create", "contracts.edit",
  "payments.view", "payments.create", "payments.approve",
  "matches.view", "matches.create",
  "training.view", "training.create",
  "tactical.view", "tactical.create",
  "performance.view",
  "notifications.view", "notifications.create",
  "audit.view",
  "settings.view", "settings.edit",
];
for (const code of perms) {
  db.prepare(`INSERT INTO permissions (id, code, description) VALUES (?, ?, ?) ON CONFLICT(code) DO NOTHING`).run(uuid(), code, code);
}

db.prepare(`INSERT INTO club_settings (id, club_name, platform_name, default_currency, timezone, player_id_format, contract_reminder_intervals)
   VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`).run(uuid(), "OTTOMAN FC", "OTTOMAN FC CONNECT", "UGX", "Africa/Kampala", "OTF-YYYY-NNNN", JSON.stringify([90, 60, 30, 7]));

console.log("Database initialized successfully!");
console.log("Create your first administrator account at /setup.");
process.exit(0);
