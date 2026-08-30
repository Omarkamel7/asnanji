const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const candidates = [
  {
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.apbkobhfnmcqqzqeeqss',
    password: 'SmartDental@2026Clinic',
    database: 'postgres',
  },
  {
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.apbkobhfnmcqqzqeeqss',
    password: 'SmartDental@2026Clinic',
    database: 'postgres',
  },
  {
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.nvpkcjhrwpglmyehksyd',
    password: 'SmartDental@2026Clinic',
    database: 'postgres',
  },
  {
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.nvpkcjhrwpglmyehksyd',
    password: 'SmartDental@2026Clinic',
    database: 'postgres',
  },
  {
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.apbkobhfnmcqqzqeeqss',
    password: 'SmartDental@2026Clinic',
    database: 'postgres',
  },
  {
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.apbkobhfnmcqqzqeeqss',
    password: 'SmartDental@2026Clinic',
    database: 'postgres',
  }
];

async function run() {
  let activeClient = null;
  for (const c of candidates) {
    console.log(`Trying ${c.user} @ ${c.host}:${c.port} ...`);
    const client = new Client({
      ...c,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      console.log(`>>> CONNECTED SUCCESSFUL to ${c.user} @ ${c.host}:${c.port}!`);
      activeClient = client;
      break;
    } catch (err) {
      console.log(`Failed: ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }

  if (!activeClient) {
    console.error('All candidates failed.');
    return;
  }

  try {
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix_rls_and_realtime.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');

    // Run the migration SQL!
    console.log('Running migration on Supabase...');
    await activeClient.query(sql);
    console.log('Migration executed successfully!');

    const res = await activeClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Existing tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    await activeClient.end();
  }
}

run();
