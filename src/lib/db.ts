"use strict";

import { Pool, type PoolClient, type QueryResult } from "pg";
import { sqliteDb, type QueryResult as SqliteQueryResult } from "./db-sqlite";

let pool: Pool | null = null;

const USE_SQLITE = process.env.USE_SQLITE === "true";

export interface DbPool {
  query: (text: string, params?: unknown[]) => Promise<QueryResult>;
  connect: () => Promise<PoolClient>;
  end: () => Promise<void>;
}

export type DbQueryResult = QueryResult;

function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST || "127.0.0.1"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "postgres"}`;

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected PostgreSQL pool error:", err);
    });
  }
  return pool;
}

export const db: DbPool = {
  query: async (text, params) => {
    if (USE_SQLITE) {
      const result = await sqliteDb.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount } as unknown as QueryResult;
    }
    return getPool().query(text, params);
  },
  connect: async () => {
    if (USE_SQLITE) {
      return sqliteDb.connect() as unknown as Promise<PoolClient>;
    }
    return getPool().connect();
  },
  end: async () => {
    if (USE_SQLITE) {
      await sqliteDb.end();
      return;
    }
    if (pool) await pool.end();
  },
};

/**
 * Execute a single SQL statement.
 */
export async function sql(text: string, params?: unknown[]) {
  return db.query(text, params);
}

/**
 * Run a transaction with a callback receiving a client.
 */
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initialize the database schema from the schema.sql file.
 * This is idempotent (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).
 */
export async function initializeSchema(): Promise<void> {
  if (USE_SQLITE) {
    await import("./db-sqlite").then((m) => m.initializeSqliteSchema());
    return;
  }
  const fs = await import("fs");
  const path = await import("path");
  const schemaPath = path.resolve(
    process.cwd(),
    "database",
    "schema.sql"
  );
  const schema = fs.readFileSync(schemaPath, "utf8");
  await db.query(schema);
}

/**
 * Seed the database with default users and roles.
 */
export async function seedDatabase(): Promise<void> {
  if (USE_SQLITE) {
    await import("./db-sqlite").then((m) => m.seedSqliteDatabase());
    return;
  }
  throw new Error("seedDatabase is only available with SQLite");
}

export async function checkConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (USE_SQLITE) {
      const { checkSqliteConnection } = await import("./db-sqlite");
      return checkSqliteConnection();
    }
    const result = await db.query("SELECT 1 AS connected, now() AS server_time");
    return {
      ok: true,
      error: undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ensures the database is reachable; throws a DB_UNAVAILABLE error otherwise.
 */
export async function requireDatabase(): Promise<void> {
  const health = await checkConnection();
  if (!health.ok) {
    const err: any = new Error("Database unavailable");
    err.code = "DB_UNAVAILABLE";
    err.message = health.error;
    throw err;
  }
}
