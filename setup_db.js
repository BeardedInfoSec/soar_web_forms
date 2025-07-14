require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT, 10),
});

const users = [
  {
    username: 'admin_user',
    password: 's0aring42',
    role: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
  },
  {
    username: 'dev_user',
    password: 'soardev',
    role: 'developer',
    email: 'dev@example.com',
    first_name: 'Dev',
    last_name: 'User',
  },
  {
    username: 'read_user',
    password: 'soaruser',
    // role intentionally left out to test default
    email: 'reader@example.com',
    first_name: 'Read',
    last_name: 'User',
  },
];

// Function to ask for user input in console
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function dropTablesIfExist() {
  const tables = ['users', 'forms', 'configuration'];
  for (const table of tables) {
    const answer = await askQuestion(`Table "${table}" exists. Delete? (y/n): `);
    if (answer.toLowerCase() === 'y') {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`Dropped table: ${table}`);
    } else {
      console.log(`Skipped dropping table: ${table}`);
    }
  }
}

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS configuration (
      id SERIAL PRIMARY KEY,
      ph_auth_token VARCHAR,
      server VARCHAR,
      ssl_verification BOOLEAN,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forms (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      label VARCHAR(255) NOT NULL,
      tags TEXT,
      elements JSONB,
      xml_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'read-only',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Tables created or verified successfully.');
}

async function upsertUsers() {
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    const role = user.role && user.role.trim() ? user.role : 'read-only';
    await pool.query(
      `INSERT INTO users (username, password, role, email, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;`,
      [user.username, hash, role, user.email, user.first_name, user.last_name]
    );
    console.log(`Inserted or updated user: ${user.username} with role: ${role}`);
  }
}

(async () => {
  try {
    // Check if tables exist, then ask to drop
    await dropTablesIfExist();
    // Create tables fresh
    await createTables();
    // Insert or update default users
    await upsertUsers();
  } catch (err) {
    console.error('Error during setup:', err);
  } finally {
    await pool.end();
  }
})();
