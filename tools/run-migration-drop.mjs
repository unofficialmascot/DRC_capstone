import { Client } from 'pg';
import fs from 'fs';

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://test:test@127.0.0.1:5432/testdb',
});

try {
  await client.connect();
  const sql = fs.readFileSync('./migrations/0016_drop_document_signatures.sql', 'utf8');
  await client.query(sql);
  console.log('Migration applied successfully');
  await client.end();
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
