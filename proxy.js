require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Pool } = require('pg');

const app = express();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT, 10),
});

// CORS middleware - must be before proxy middleware
app.use((req, res, next) => {
  // Adjust Access-Control-Allow-Origin to your frontend URL if needed, e.g. 'http://localhost:3002'
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, ph-auth-token'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // Respond OK to OPTIONS preflight requests
  }
  next();
});

// Function to get target URL either from DB or fallback to env var
async function getTargetURL() {
  try {
    const result = await pool.query('SELECT server FROM configurations LIMIT 1');
    if (result.rows.length === 0) {
      console.warn('No configuration found in DB, falling back to PROXY_TARGET env var');
      if (!process.env.PROXY_TARGET) {
        throw new Error('No proxy target found in DB or environment variable');
      }
      return process.env.PROXY_TARGET;
    }
    return result.rows[0].server;
  } catch (err) {
    console.error('Failed to fetch server URL from database:', err.message);
    process.exit(1);
  }
}

(async () => {
  const target = await getTargetURL();

  app.use(
    '/proxy',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false, // Set false for self-signed certs; true if certs valid
      pathRewrite: {
        '^/proxy': '', // remove /proxy prefix when forwarding
      },
      onProxyReq: (proxyReq, req) => {
        console.log(
          `🔁 Proxying request: ${req.method} ${req.originalUrl} → ${target}${req.url.replace(
            /^\/proxy/,
            ''
          )}`
        );
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        res.status(500).send('Proxy error occurred.');
      },
    })
  );

  // Read proxy port from env or default to 3001
  const PORT = process.env.PROXY_PORT ? parseInt(process.env.PROXY_PORT, 10) : 3001;

  app.listen(PORT, () => {
    console.log(`✅ Proxy running on http://localhost:${PORT} → ${target}`);
  });
})();
