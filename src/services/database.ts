import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;
let queue: Promise<unknown> = Promise.resolve();

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("lancr.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        company TEXT,
        notes TEXT,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        hourlyRate REAL DEFAULT 0,
        deadline TEXT,
        notes TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER NOT NULL,
        startedAt INTEGER NOT NULL,
        endedAt INTEGER,
        duration INTEGER DEFAULT 0,
        FOREIGN KEY (projectId) REFERENCES projects(id)
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId INTEGER NOT NULL,
        clientId INTEGER NOT NULL,
        amount REAL NOT NULL,
        hours REAL DEFAULT 0,
        hourlyRate REAL DEFAULT 0,
        status TEXT DEFAULT 'unpaid',
        createdAt INTEGER NOT NULL,
        paidAt INTEGER,
        FOREIGN KEY (projectId) REFERENCES projects(id),
        FOREIGN KEY (clientId) REFERENCES clients(id)
      );
    `);

    await db.execAsync(`ALTER TABLE clients ADD COLUMN notes TEXT`).catch(() => {});
    await db.execAsync(`ALTER TABLE projects ADD COLUMN notes TEXT`).catch(() => {});
    await db.execAsync(`ALTER TABLE invoices ADD COLUMN hours REAL DEFAULT 0`).catch(() => {});
    await db.execAsync(`ALTER TABLE invoices ADD COLUMN hourlyRate REAL DEFAULT 0`).catch(() => {});
    await db.execAsync(`ALTER TABLE invoices ADD COLUMN invoiceNumber INTEGER DEFAULT 0`).catch(() => {});

    await db.execAsync(`DELETE FROM time_entries WHERE projectId NOT IN (SELECT id FROM projects)`);
    await db.execAsync(`DELETE FROM invoices WHERE projectId NOT IN (SELECT id FROM projects) OR clientId NOT IN (SELECT id FROM clients)`);
    await db.execAsync(`DELETE FROM projects WHERE clientId NOT IN (SELECT id FROM clients)`);
  }
  return db;
}

export function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn, fn);
  queue = result.catch(() => {});
  return result;
}
