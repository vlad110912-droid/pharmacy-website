require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

function formatConnectionHint() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';

  return [
    `[migrate] PostgreSQL is not reachable at ${host}:${port}.`,
    '[migrate] Start PostgreSQL first, then rerun the migration.',
    '[migrate] If you use Docker Compose, run `docker compose up -d db` from the `code/` folder and make sure Docker Desktop is running.',
  ].join('\n');
}

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    console.log(`[migrate] Running ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`[migrate] Done: ${file}`);
  }

  await pool.end();
  console.log('[migrate] All migrations completed.');
}

migrate().catch(err => {
  if (err && err.code === 'ECONNREFUSED') {
    console.error(formatConnectionHint());
    console.error('[migrate] Error: ECONNREFUSED');
    process.exit(1);
  }
  console.error('[migrate] Error:', err);
  process.exit(1);
});
