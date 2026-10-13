// ============================================================================
// BUS STOP — RUN SQL SCHEMA DIRECTLY TO SUPABASE POSTGRESQL
// Usage: node run_schema.js <your-database-password>
// ============================================================================

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
let dbPassword = process.argv[2] || process.env.DATABASE_PASSWORD;
let dbUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      const key = m[1];
      let val = (m[2] || '').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key === 'DATABASE_PASSWORD' && !dbPassword) dbPassword = val;
      if (key === 'DATABASE_URL' && !dbUrl) dbUrl = val;
    }
  }
}

async function run() {
  if (!dbPassword && !dbUrl) {
    console.log(`
--------------------------------------------------------------------------------
AUTOMATED DATABASE MIGRATION SCRIPT
--------------------------------------------------------------------------------
To run the SQL schema directly from the terminal, provide your Supabase database password:

  node run_schema.js <YOUR_DB_PASSWORD>

Or add it to .env.local:
  DATABASE_PASSWORD=your_password_here

Alternatively, you can run supabase_schema.sql in 1 click in your Supabase Dashboard:
👉 https://supabase.com/dashboard/project/tmacsdrjzkgykfkkrhgm/sql/new
--------------------------------------------------------------------------------
`);
    process.exit(0);
  }

  const connectionString = dbUrl || `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.tmacsdrjzkgykfkkrhgm.supabase.co:5432/postgres`;
  console.log('Connecting to Supabase PostgreSQL database...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    const sqlFilePath = path.join(__dirname, 'supabase_schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing supabase_schema.sql (10 tables, triggers, RLS, seeds)...');
    await client.query(sql);

    console.log('\n=============================================================');
    console.log('SUCCESS! All 10 tables, triggers, and seed data have been applied!');
    console.log('=============================================================');

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Tables created in public schema:');
    res.rows.forEach(r => console.log('  - ' + r.table_name));

    await client.end();
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();
