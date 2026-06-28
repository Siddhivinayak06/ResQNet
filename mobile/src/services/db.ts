import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDb = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('resqnet.db');

  // Create queue table for incidents that failed to sync
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS incident_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return db;
};

export const queueIncident = async (payload: any) => {
  const database = await initDb();
  const result = await database.runAsync(
    'INSERT INTO incident_queue (payload, status) VALUES (?, ?)',
    JSON.stringify(payload),
    'pending'
  );
  return result.lastInsertRowId;
};

export const getQueuedIncidents = async () => {
  const database = await initDb();
  const allRows = await database.getAllAsync('SELECT * FROM incident_queue WHERE status = ?', ['pending']);
  return allRows.map((row: any) => ({
    id: row.id,
    payload: JSON.parse(row.payload),
    createdAt: row.created_at,
  }));
};

export const markIncidentSynced = async (id: number) => {
  const database = await initDb();
  await database.runAsync('UPDATE incident_queue SET status = ? WHERE id = ?', 'synced', id);
};

export const deleteSyncedIncidents = async () => {
  const database = await initDb();
  await database.runAsync('DELETE FROM incident_queue WHERE status = ?', 'synced');
};
