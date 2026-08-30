const { Client } = require('pg');

const regions = [
  'eu-west-1',
  'eu-central-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ca-central-1',
  'sa-east-1'
];

async function probe() {
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    const client = new Client({
      host,
      port: 6543,
      user: 'postgres.nvpkcjhrwpglmyehksyd',
      password: 'SmartDental@2026Clinic',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });

    try {
      await client.connect();
      console.log(`>>> SUCCESS! Connected to region: ${reg} (${host})`);
      await client.end();
      return reg;
    } catch (err) {
      if (err.message && !err.message.includes('not found') && !err.message.includes('ENOTFOUND')) {
        console.log(`Region ${reg}: response -> ${err.message}`);
      }
    }
  }
  console.log('Finished probing.');
}

probe();
