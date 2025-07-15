require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const saltRounds = 10; // You can adjust the salt rounds
const app = express(); // Initialize the Express app

// Allow CORS requests from your frontend
app.use(cors({
  origin: 'http://localhost:3002', // Replace with your frontend's actual URL
}));

app.use(express.json()); // Parse incoming JSON requests

// Configure PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT, 10), // port should be a number
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

app.get('/api/configuration', async (req, res) => {
    try {
        const result = await getConfiguration(); // Fetch configuration
        if (result.rowCount === 0) {
            console.warn('No configuration found in the database'); // Log warning for no configuration
            return res.status(404).json({ message: 'No configuration found' });
        }
        
        console.log('Configuration fetched successfully:', result.rows[0]); // Log successful fetch
        res.status(200).json(result.rows[0]); // Return the configuration data
    } catch (error) {
        console.error('Error fetching configuration:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message }); // Include error message for debugging
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

    // Return the token, role, and username
    res.json({ token, role: user.role, username: user.username });
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
  const { name, label, tags, elements, xmlData, overwrite } = req.body; // Adding 'overwrite' flag

  if (!name || !label || !elements || !xmlData) {
    return res.status(400).json({ message: 'Name, label, elements, and xmlData are required' });
  }

  try {
    // Check if a form with the same name already exists
    const checkQuery = 'SELECT * FROM forms WHERE name = $1';
    const checkResult = await pool.query(checkQuery, [name]);

    if (checkResult.rows.length > 0) {
      if (overwrite) {
        // If overwrite is true, update the existing form
        const updateQuery = `
          UPDATE forms
          SET label = $2, tags = $3, elements = $4, xml_data = $5, updated_at = CURRENT_TIMESTAMP
          WHERE name = $1
          RETURNING *;
        `;
        const result = await pool.query(updateQuery, [name, label, tags, JSON.stringify(elements), xmlData]);
        return res.status(200).json({ message: 'Form updated successfully', form: result.rows[0] });
      } else {
        // If overwrite is false, return a conflict status
        return res.status(409).json({ message: 'A form with this name already exists. Set overwrite to true to update it.' });
      }
    }

    // If no form with the same name exists, proceed with saving the form
    const insertQuery = `
      INSERT INTO forms (name, label, tags, elements, xml_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await pool.query(insertQuery, [name, label, tags, JSON.stringify(elements), xmlData]);

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

app.get('/forms/:name', async (req, res) => {
  const name = decodeURIComponent(req.params.name); // Decode the form name from the URL

  try {
    // Ensure that the query treats `name` as a string
    const query = 'SELECT name, label, tags, elements, xml_data FROM forms WHERE name = $1';
    const result = await pool.query(query, [name]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json(result.rows[0]); // Return the form data
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.get('/forms/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const query = 'SELECT * FROM forms WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching form:', error);
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

app.post('/admin/create-user', async (req, res) => {
  const { firstName, lastName, email, username, password, role } = req.body;

  if (!firstName || !lastName || !email || !username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check for existing user by username or email
    const userCheckQuery = `
      SELECT * FROM users WHERE username = $1 OR email = $2;
    `;
    const userCheckResult = await pool.query(userCheckQuery, [username, email]);

    if (userCheckResult.rowCount > 0) {
      if (userCheckResult.rows[0].username === username) {
        return res.status(409).json({ message: 'Username already exists.' });
      }
      if (userCheckResult.rows[0].email === email) {
        return res.status(409).json({ message: 'Email already exists.' });
      }
    }

    // Hash the password here using bcrypt or similar
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (first_name, last_name, email, username, password, role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const result = await pool.query(query, [firstName, lastName, email, username, hashedPassword, role]);

    res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset Password Endpoint
app.post('/admin/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ message: 'Username and new password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `
      UPDATE users 
      SET password = $1 
      WHERE username = $2 
      RETURNING *;
    `;
    const result = await pool.query(query, [hashedPassword, username]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Password reset successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Grant Permissions Endpoint (adjust based on your permission structure)
app.post('/admin/grant-permissions', async (req, res) => {
  const { username, role } = req.body; // Updated to match frontend

  if (!username || !role) {
    return res.status(400).json({ message: 'Username and role are required' });
  }

  try {
    const query = `
      UPDATE users 
      SET role = $1 
      WHERE username = $2 
      RETURNING *;
    `;
    const result = await pool.query(query, [role, username]); // Ensure variable name matches

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Permissions granted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error granting permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT username FROM users'); // Adjust query as needed
    res.status(200).json(result.rows); // Send the list of users
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
