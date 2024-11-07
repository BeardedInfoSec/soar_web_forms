require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express(); // Initialize the Express app

// Allow CORS requests from your frontend
app.use(cors({
  origin: 'http://localhost:5000' // Replace with your frontend's actual URL
}));

app.use(express.json()); // Parse incoming JSON requests

// Configure PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

// Configuration Save Endpoint
app.post('/configuration', async (req, res) => {
  const { server, ph_auth_token, ssl_verification } = req.body;

  // Validate the request payload
  if (!server || !ph_auth_token || ssl_verification === undefined) {
    return res.status(400).json({ message: 'Invalid request payload' });
  }

  try {
    // Insert the configuration into the database
    const query = `
      INSERT INTO configurations (server, ph_auth_token, ssl_verification, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await pool.query(query, [server, ph_auth_token, ssl_verification]);
    
    res.status(200).json({ message: 'Configuration saved successfully', config: result.rows[0] });
  } catch (err) {
    console.error('Error inserting configuration:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).send('Invalid credentials');
    }

    const user = result.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in');
  }
});

// Protected Route Example
app.get('/protected', authenticate, (req, res) => {
  res.send('This is a protected route');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
