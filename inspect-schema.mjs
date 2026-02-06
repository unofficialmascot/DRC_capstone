import pg from 'pg';

const { Pool } = pg;

const connectionString = 'postgres://avnadmin:AVNS_rS7PrxTF3ZigYE2NWYg@drcpg-311b7b85-drc123.g.aivencloud.com:20040/defaultdb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: true
});

try {
  const client = await pool.connect();
  
  console.log('=== DATABASE SCHEMA INSPECTION ===\n');
  
  // Get all tables
  const tablesResult = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  
  console.log(`Found ${tablesResult.rows.length} tables:\n`);
  
  for (const tableRow of tablesResult.rows) {
    const tableName = tableRow.table_name;
    
    // Get columns for this table
    const columnsResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    // Get primary key
    const pkResult = await client.query(`
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      JOIN pg_class t ON t.oid = i.indrelid
      WHERE i.indisprimary AND t.relname = $1
    `, [tableName]);
    
    const pkColumns = pkResult.rows.map(r => r.column_name);
    
    // Get foreign keys
    const fkResult = await client.query(`
      SELECT 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
    `, [tableName]);
    
    console.log(`📋 ${tableName}`);
    console.log('   Columns:');
    columnsResult.rows.forEach(col => {
      const pk = pkColumns.includes(col.column_name) ? ' [PK]' : '';
      const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
      const default_val = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`     - ${col.column_name}: ${col.data_type}${pk}${nullable}${default_val}`);
    });
    
    if (fkResult.rows.length > 0) {
      console.log('   Foreign Keys:');
      fkResult.rows.forEach(fk => {
        console.log(`     - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    console.log();
  }
  
  client.release();
  await pool.end();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
