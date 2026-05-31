import { dirname } from 'path';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';

export type Database = SqlJsDatabase;

let db: Database | null = null;
let dbPath = './data/gateway.db';

export async function initializeDatabase(path = './data/gateway.db'): Promise<Database> {
  if (db) {
    return db;
  }

  const SQL = await initSqlJs();

  try {
    const fs = await import('fs');
    if (fs.existsSync(path)) {
      const buffer = fs.readFileSync(path);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();

      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS request_logs (
          id TEXT PRIMARY KEY,
          model TEXT NOT NULL,
          provider TEXT NOT NULL,
          prompt_tokens INTEGER,
          completion_tokens INTEGER,
          total_tokens INTEGER,
          latency_ms INTEGER,
          status TEXT NOT NULL,
          error TEXT,
          created_at INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS provider_status (
          provider TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          last_check INTEGER NOT NULL,
          message TEXT,
          retry_after INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    }
  } catch {
    console.warn('[Storage] Running in memory mode (no filesystem)');
    db = new SQL.Database();

    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS request_logs (
        id TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        latency_ms INTEGER,
        status TEXT NOT NULL,
        error TEXT,
        created_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS provider_status (
        provider TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        last_check INTEGER NOT NULL,
        message TEXT,
        retry_after INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  dbPath = path;
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    try {
      const fs = await import('fs');
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.mkdirSync(dirname(dbPath), { recursive: true });
      fs.writeFileSync(dbPath, buffer);
    } catch {
      console.warn('[Storage] Could not save database to disk');
    }
    db.close();
    db = null;
  }
}

export const schema = {
  settings: 'settings',
  requestLogs: 'request_logs',
  providerStatus: 'provider_status',
  appState: 'app_state',
};
