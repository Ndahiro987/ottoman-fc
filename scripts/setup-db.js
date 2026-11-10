const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  database: 'postgres',
  password: '',
});

async function main() {
  const client = await pool.connect();
  try {
    // Create role
    await client.query(`DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ottomanfc') THEN
          CREATE ROLE ottomanfc LOGIN;
        END IF;
      END $$;`);

    // Create database
    const dbRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ottomanfc'"
    );
    if (dbRes.rows.length === 0) {
      await client.query('CREATE DATABASE ottomanfc OWNER ottomanfc');
      console.log('Database ottomanfc created');
    } else {
      console.log('Database ottomanfc already exists');
    }
  } finally {
    client.release();
  }

  // Now connect to ottomanfc db and run schema
  const schemaPool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'ottomanfc',
    database: 'ottomanfc',
  });
  const sc = await schemaPool.connect();
  try {
    const fs = require('fs');
    const schema = fs.readFileSync(
      'C:/Users/hp/Desktop/ottoman/ottoman-fc-connect/database/schema.sql',
      'utf8'
    );
    // Split by semicolon but be careful with DO blocks
    await sc.query(schema);
    console.log('Schema applied successfully');
  } finally {
    sc.release();
  }
  await schemaPool.end();
  await pool.end();
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
