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

async function getTargetURL() {
  try {
    const result = await pool.query('SELECT server FROM configurations LIMIT 1');
    if (result.rows.length === 0) {
      throw new Error('No configuration found in the database');
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
      secure: false, // Disable SSL verification (self-signed certs)
      onProxyReq: (proxyReq) => {
        console.log(`🔁 Proxying request to: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy Error:', err.message);
        res.status(500).send('Proxy error occurred.');
      },
    })
  );

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`✅ Proxy running on http://localhost:${PORT} → ${target}`);
  });
})();
