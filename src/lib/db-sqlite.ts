"use strict";

import { Database as Sqlite3Database, type Database as Sqlite3DatabaseType } from "sqlite3";
import { open, type Database as BetterSqlite3Database } from "sqlite";
import _path from "path";

const DB_PATH = process.env.SQLITE_DB_PATH || _path.resolve(process.cwd(), "ottoman-fc.db");

let _db: BetterSqlite3Database | null = null;

async function getDb(): Promise<BetterSqlite3Database> {
  if (!_db) {
    _db = await open({
      filename: DB_PATH,
      driver: Sqlite3Database,
    });
    await _db.run("PRAGMA journal_mode = WAL");
    await _db.run("PRAGMA foreign_keys = ON");
  }
  return _db;
}

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

export interface QueryResult {
  rows: unknown[];
  rowCount: number;
}

export class SqliteDb {
  async query(text: string, params: unknown[] = []): Promise<QueryResult> {
    const db = await getDb();

    let sqliteText = text;
    const convertedParams: unknown[] = [];

    let paramIndex = 0;
    sqliteText = sqliteText.replace(/\$\d+/g, () => {
      const val = params[paramIndex];
      convertedParams.push(val);
      paramIndex++;
      return "?";
    });

    sqliteText = sqliteText
      .replace(/::[a-z]+/g, "")
      .replace(/TIMESTAMPTZ/g, "TEXT")
      .replace(/TIMESTAMP/g, "TEXT")
      .replace(/UUID/g, "TEXT")
      .replace(/JSONB/g, "TEXT")
      .replace(/SERIAL/g, "INTEGER")
      .replace(/BOOLEAN/g, "INTEGER")
      .replace(/NUMERIC/g, "REAL")
      .replace(/gen_random_uuid\(\)/g, "'" + uuidv4() + "'")
      .replace(/now\(\)/g, "'" + nowISO() + "'")
      .replace(/ON CONFLICT \(email\) DO UPDATE/g, "ON CONFLICT(email) DO UPDATE")
      .replace(/ON CONFLICT \(name\) DO NOTHING/g, "ON CONFLICT(name) DO NOTHING")
      .replace(/ON CONFLICT \(user_id, role_id\) DO NOTHING/g, "ON CONFLICT(user_id, role_id) DO NOTHING")
      .replace(/ON CONFLICT \(role_id, permission_id\) DO NOTHING/g, "ON CONFLICT(role_id, permission_id) DO NOTHING")
      .replace(/ON CONFLICT \(id\) DO NOTHING/g, "ON CONFLICT(id) DO NOTHING")
      .replace(/RETURNING/g, "");

    const isInsertWithReturning = /^\s*INSERT\s+/i.test(sqliteText) && /RETURNING/i.test(text);

    try {
      if (/^\s*(SELECT|WITH)/i.test(sqliteText)) {
        const rows = await db.all(sqliteText, ...convertedParams);
        return { rows, rowCount: rows.length };
      }

      const result = await db.run(sqliteText, ...convertedParams);

      if (isInsertWithReturning) {
        const lastId = (result.lastID as number) ?? 0;
        const tableMatch = text.match(/INTO\s+(\w+)/i);
        const tableName = tableMatch ? tableMatch[1] : "";
        const returningCols = text.match(/RETURNING\s+(.+?)(?:\s+FROM|$)/i);
        let cols = "*";
        if (returningCols) {
          cols = returningCols[1].trim();
        }
        const row = await db.get(`SELECT ${cols} FROM ${tableName} WHERE rowid = ?`, lastId);
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }

      return { rows: [], rowCount: result.changes ?? 0 };
    } catch (e: any) {
      throw new Error(`SQLite query error: ${e.message}\nQuery: ${sqliteText}\nParams: ${JSON.stringify(convertedParams)}`);
    }
  }

  async connect() {
    return {
      query: (text: string, params?: unknown[]) => this.query(text, params),
      release: () => {},
    };
  }

  async end(): Promise<void> {
    if (_db) {
      await _db.close();
      _db = null;
    }
  }
}

export const sqliteDb = new SqliteDb();

export async function initializeSqliteSchema(): Promise<void> {
  // Tables are created directly in seedSqliteDatabase()
}

export async function seedSqliteDatabase(): Promise<void> {
  const db = await getDb();

  await db.run(`CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS permissions (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, first_name TEXT, last_name TEXT, phone TEXT, role TEXT NOT NULL, is_active INTEGER DEFAULT 1, email_verified INTEGER DEFAULT 0, last_login_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS user_roles (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, role_id TEXT NOT NULL, assigned_by TEXT, assigned_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(role_id) REFERENCES roles(id), UNIQUE(user_id, role_id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS role_permissions (id TEXT PRIMARY KEY, role_id TEXT NOT NULL, permission_id TEXT NOT NULL, FOREIGN KEY(role_id) REFERENCES roles(id), FOREIGN KEY(permission_id) REFERENCES permissions(id), UNIQUE(role_id, permission_id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, player_id TEXT UNIQUE, full_name TEXT NOT NULL, email TEXT, phone TEXT, date_of_birth TEXT, gender TEXT, nationality TEXT, national_id TEXT, passport_number TEXT, residential_address TEXT, emergency_contact_name TEXT, emergency_contact_number TEXT, primary_position TEXT, secondary_position TEXT, preferred_foot TEXT, jersey_number INTEGER, previous_club TEXT, football_experience TEXT, player_category TEXT, user_id TEXT, status TEXT DEFAULT 'pending', kyc_status TEXT DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS player_documents (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, document_type TEXT, file_name TEXT, file_url TEXT, mime_type TEXT, file_size INTEGER, verification_status TEXT DEFAULT 'not_submitted', reviewing_administrator TEXT, review_date TEXT, rejection_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS player_approvals (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, status TEXT NOT NULL, reviewed_by TEXT, reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS contracts (id TEXT PRIMARY KEY, contract_number TEXT UNIQUE, player_id TEXT NOT NULL, contract_type TEXT, start_date TEXT, end_date TEXT, salary_amount REAL, salary_currency TEXT DEFAULT 'UGX', signing_fee REAL, bonus_terms TEXT, status TEXT DEFAULT 'draft', signed_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS payment_requests (id TEXT PRIMARY KEY, request_number TEXT UNIQUE, player_id TEXT NOT NULL, payment_category TEXT, amount REAL, currency TEXT DEFAULT 'UGX', payment_description TEXT, requested_date TEXT, requested_by TEXT, supporting_evidence TEXT, approval_status TEXT DEFAULT 'pending', rejected_reason TEXT, approved_by TEXT, approved_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, opponent TEXT NOT NULL, competition TEXT, match_date TEXT, venue TEXT, home_or_away TEXT DEFAULT 'home', home_score INTEGER, away_score INTEGER, status TEXT DEFAULT 'scheduled', coach_comments TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS training_sessions (id TEXT PRIMARY KEY, title TEXT NOT NULL, session_type TEXT, session_date TEXT, venue TEXT, responsible_coach TEXT, description TEXT, squad_ids TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, message TEXT, type TEXT DEFAULT 'info', is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, link TEXT)`);
  await db.run(`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, entity_type TEXT, entity_id TEXT, old_values TEXT, new_values TEXT, ip_address TEXT, user_agent TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS club_settings (id TEXT PRIMARY KEY, club_name TEXT DEFAULT 'OTTOMAN FC', platform_name TEXT DEFAULT 'OTTOMAN FC CONNECT', club_logo_url TEXT, contact_email TEXT, contact_phone TEXT, club_address TEXT, default_currency TEXT DEFAULT 'UGX', timezone TEXT DEFAULT 'Africa/Kampala', player_id_format TEXT DEFAULT 'OTF-YYYY-NNNN', contract_reminder_intervals TEXT DEFAULT '[90, 60, 30, 7]', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, coach_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS formations (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT, is_custom INTEGER DEFAULT 0, created_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS lineups (id TEXT PRIMARY KEY, name TEXT NOT NULL, formation_id TEXT, match_id TEXT, coach_id TEXT, selection_date TEXT DEFAULT CURRENT_TIMESTAMP, is_active INTEGER DEFAULT 1, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS lineup_players (id TEXT PRIMARY KEY, lineup_id TEXT NOT NULL, player_id TEXT NOT NULL, position TEXT, jersey_number INTEGER, is_captain INTEGER DEFAULT 0, is_subscribe INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(lineup_id) REFERENCES lineups(id), FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS match_events (id TEXT PRIMARY KEY, match_id TEXT NOT NULL, minute INTEGER, event_type TEXT, player_id TEXT, description TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(match_id) REFERENCES matches(id), FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS player_match_statistics (id TEXT PRIMARY KEY, match_id TEXT NOT NULL, player_id TEXT NOT NULL, starter INTEGER DEFAULT 0, minutes_played INTEGER DEFAULT 0, goals INTEGER DEFAULT 0, assists INTEGER DEFAULT 0, shots INTEGER DEFAULT 0, shots_on_target INTEGER DEFAULT 0, passes_completed INTEGER DEFAULT 0, pass_accuracy REAL, chances_created INTEGER DEFAULT 0, tackles INTEGER DEFAULT 0, interceptions INTEGER DEFAULT 0, clearances INTEGER DEFAULT 0, saves INTEGER DEFAULT 0, clean_sheets INTEGER DEFAULT 0, yellow_cards INTEGER DEFAULT 0, red_cards INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(match_id, player_id), FOREIGN KEY(match_id) REFERENCES matches(id), FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS player_performance_scores (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, match_id TEXT, technical_score REAL, tactical_score REAL, physical_score REAL, attacking_score REAL, defensive_score REAL, teamwork_score REAL, discipline_score REAL, overall_score REAL, coach_rating REAL, coach_notes TEXT, calculated_at TEXT DEFAULT CURRENT_TIMESTAMP, calculated_by TEXT, FOREIGN KEY(player_id) REFERENCES players(id), FOREIGN KEY(match_id) REFERENCES matches(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS player_evaluations (id TEXT PRIMARY KEY, player_id TEXT NOT NULL, evaluator_id TEXT, evaluation_date TEXT DEFAULT CURRENT_TIMESTAMP, category TEXT, rating REAL, comments TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS training_attendance (id TEXT PRIMARY KEY, training_session_id TEXT NOT NULL, player_id TEXT NOT NULL, status TEXT NOT NULL, recorded_at TEXT DEFAULT CURRENT_TIMESTAMP, recorded_by TEXT, UNIQUE(training_session_id, player_id), FOREIGN KEY(training_session_id) REFERENCES training_sessions(id), FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS tactical_plans (id TEXT PRIMARY KEY, name TEXT NOT NULL, formation TEXT, match_or_training TEXT, coaching_notes TEXT, created_by TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await db.run(`CREATE TABLE IF NOT EXISTS tactical_players (id TEXT PRIMARY KEY, tactical_plan_id TEXT NOT NULL, player_id TEXT, position_x REAL, position_y REAL, jersey_number INTEGER, role TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(tactical_plan_id) REFERENCES tactical_plans(id), FOREIGN KEY(player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS tactical_movements (id TEXT PRIMARY KEY, tactical_plan_id TEXT NOT NULL, from_player_id TEXT, to_player_id TEXT, movement_type TEXT, path_data TEXT, sequence_order INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(tactical_plan_id) REFERENCES tactical_plans(id), FOREIGN KEY(from_player_id) REFERENCES players(id), FOREIGN KEY(to_player_id) REFERENCES players(id))`);
  await db.run(`CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT, audience TEXT DEFAULT 'all', published_by TEXT, published_at TEXT DEFAULT CURRENT_TIMESTAMP, expires_at TEXT)`);
  await db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token TEXT NOT NULL, expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);

  await db.run(`INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING`, uuidv4(), "administrator", "Full system access");
  await db.run(`INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING`, uuidv4(), "coach", "Coaching and team management");
  await db.run(`INSERT INTO roles (id, name, description) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING`, uuidv4(), "player", "Player portal access");

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
    await db.run(`INSERT INTO permissions (id, code, description) VALUES (?, ?, ?) ON CONFLICT(code) DO NOTHING`, uuidv4(), code, code);
  }

  await db.run(`INSERT INTO club_settings (id, club_name, platform_name, default_currency, timezone, player_id_format, contract_reminder_intervals)
     VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`, uuidv4(), "OTTOMAN FC", "OTTOMAN FC CONNECT", "UGX", "Africa/Kampala", "OTF-YYYY-NNNN", JSON.stringify([90, 60, 30, 7]));
}

export async function checkSqliteConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = await getDb();
    await db.get("SELECT 1 AS connected");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
