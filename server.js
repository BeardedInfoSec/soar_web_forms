require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express(); // Initialize the Express app

// Allow CORS requests from your frontend
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's actual URL
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

// Verify connection to the database and log current user
pool.query('SELECT current_user', (err, result) => {
  if (err) {
    console.error('Error checking current user:', err);
  } else {
    console.log('Connected to the database as user:', result.rows[0].current_user);
  }
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

// Helper function to fetch configuration
const getConfiguration = async () => {
  const query = 'SELECT server, ph_auth_token, ssl_verification FROM configurations LIMIT 1';
  return await pool.query(query);
};

// Configuration Save Endpoint
app.post('/configuration', async (req, res) => {
  const { server, ph_auth_token, ssl_verification } = req.body;

  if (!server || !ph_auth_token || ssl_verification === undefined) {
    return res.status(400).json({ message: 'Invalid request payload' });
  }

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Truncate the table to ensure only one entry exists
    await pool.query('TRUNCATE TABLE configurations');

    // Insert the new configuration
    const query = `
      INSERT INTO configurations (server, ph_auth_token, ssl_verification, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await pool.query(query, [server, ph_auth_token, ssl_verification]);
    
    // Commit the transaction
    await pool.query('COMMIT');

    console.log('Insert result:', result);

    if (result.rowCount === 1) {
      res.status(200).json({ message: 'Configuration saved successfully', config: result.rows[0] });
    } else {
      throw new Error('Insert operation failed');
    }
  } catch (err) {
    // Rollback the transaction in case of an error
    await pool.query('ROLLBACK');
    console.error('Error inserting configuration:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test Connection Endpoint
app.get('/test_connection', async (req, res) => {
  try {
    const result = await getConfiguration(); // Use helper function

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No configuration found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching configuration for test connection:', error);
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
    console.error('Error logging in:', err);
    res.status(500).send('Error logging in');
  }
});

// Protected Route Example
app.get('/protected', authenticate, (req, res) => {
  res.send('This is a protected route');
});

// Save Form Endpoint
app.post('/save_form', async (req, res) => {
  const { name, label, tags, elements, xmlData } = req.body;

  if (!name || !label || !elements || !xmlData) {
    return res.status(400).json({ message: 'Name, label, elements, and xmlData are required' });
  }

  try {
    const query = `
      INSERT INTO forms (name, label, tags, elements, xml_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, label, tags, JSON.stringify(elements), xmlData]);

    res.status(201).json({ message: 'Form saved successfully', form: result.rows[0] });
  } catch (err) {
    console.error('Error saving form:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Forms Endpoint
app.get('/forms', async (req, res) => {
  try {
    const query = 'SELECT * FROM forms';
    const result = await pool.query(query);
    
    res.status(200).json(result.rows); // Send all forms as a response
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Form Endpoint
app.delete('/forms/:id', async (req, res) => {
  const id = parseInt(req.params.id); // Convert the ID to an integer

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const query = 'DELETE FROM forms WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]); // Pass the integer ID

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json({ message: 'Form deleted successfully', form: result.rows[0] });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/forms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'SELECT * FROM forms WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json(result.rows[0]); // Send the specific form
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
