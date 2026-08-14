const { resolve } = require('path');
const { config } = require('dotenv');
const { Client } = require('pg');

config({ path: resolve(process.cwd(), '../../.env') });

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  const result = await client.query('select current_user as "user", current_database() as "database"');
  const row = result.rows[0];

  if (process.env.POSTGRES_USER && row.user !== process.env.POSTGRES_USER) {
    throw new Error(`DATABASE_URL connected as ${row.user}, expected ${process.env.POSTGRES_USER}`);
  }

  if (process.env.POSTGRES_DB && row.database !== process.env.POSTGRES_DB) {
    throw new Error(`DATABASE_URL connected to ${row.database}, expected ${process.env.POSTGRES_DB}`);
  }

  console.log(`${row.user}@${row.database}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => undefined);
  });
