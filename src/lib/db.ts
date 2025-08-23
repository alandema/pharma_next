import { createClient } from '@libsql/client';

// Simple singleton Turso (libsql) client
let _client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Missing TURSO_DATABASE_URL');
    if (!authToken) throw new Error('Missing TURSO_AUTH_TOKEN');
    _client = createClient({ url, authToken });
  }
  return _client;
}

export async function migrate() {
  const db = getDb();
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin','doctor','nurse','employee')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rg TEXT,
      gender TEXT,
      cpf TEXT UNIQUE,
      birth_date TEXT,
      phone TEXT,
      zipcode TEXT,
      street TEXT,
      district TEXT,
      house_number TEXT,
      additional_info TEXT,
      country TEXT,
      state TEXT,
      city TEXT,
      medical_history TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date_prescribed TEXT NOT NULL,
      json_form_info TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS cids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      information TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  ];
  for (const sql of statements) {
    await db.execute(sql);
  }
}
