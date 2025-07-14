require('dotenv').config();
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
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    username: 'dev_user',
    password: 'soardev',
    role: 'developer',
    email: 'dev@example.com',
    firstName: 'Dev',
    lastName: 'User',
  },
  {
    username: 'read_user',
    password: 'soaruser',
    role: 'read-only',
    email: 'reader@example.com',
    firstName: 'Read',
    lastName: 'User',
  },
];

async function createTables() {
  try {
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
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created or verified successfully.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

async function upsertUsers() {
  try {
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 10);
      await pool.query(
        `INSERT INTO users (username, password, role, email, "firstName", "lastName")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;`,
        [user.username, hash, user.role, user.email, user.firstName, user.lastName]
      );
      console.log(`Inserted or updated user: ${user.username}`);
    }
  } catch (error) {
    console.error('Error inserting/updating users:', error);
    throw error;
  }
}

(async () => {
  try {
    await createTables();
    await upsertUsers();
  } finally {
    await pool.end();
  }
})();
