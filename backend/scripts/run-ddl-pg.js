const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Try connecting to Supabase Postgres instance
// Connection string formats:
// 1. Direct: postgresql://postgres:password@db.eowncuosupdfnoxedrla.supabase.co:5432/postgres
// 2. Transaction pooler: postgresql://postgres.eowncuosupdfnoxedrla:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.eowncuosupdfnoxedrla:QuickFixGrocery2026!@db.eowncuosupdfnoxedrla.supabase.co:5432/postgres';

async function executeDDL() {
  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Successfully connected to Supabase PostgreSQL database!');

    const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '03_realtime_lifecycle_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 03 DDL...');
    await client.query(sql);
    console.log('✓ Migration 03 DDL executed successfully!');

    console.log('Reloading PostgREST schema cache...');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✓ PostgREST schema cache reloaded!');

    await client.end();
  } catch (err) {
    console.log('Postgres connection note:', err.message);
  }
}

executeDDL();
