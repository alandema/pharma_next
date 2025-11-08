#!/usr/bin/env node
/**
 * Database Migration Script
 * 
 * This script runs database migrations to create/update tables.
 * Run this script during deployment or when setting up a new environment.
 * 
 * Usage:
 *   npm run migrate
 *   or
 *   npx tsx scripts/migrate.ts
 */

import { prisma } from '../src/lib/prisma';

async function migrate() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin','doctor','nurse','employee')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
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
    )`,
    `CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date_prescribed TEXT NOT NULL,
      json_form_info TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS cids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      information TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}

async function main() {
  try {
    console.log('🔄 Running database migrations...');
    await migrate();
    console.log('✅ Database migrations completed successfully!');
    console.log('📊 Tables created/verified:');
    console.log('   - users');
    console.log('   - patients');
    console.log('   - prescriptions');
    console.log('   - cids');
    console.log('   - medications');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
