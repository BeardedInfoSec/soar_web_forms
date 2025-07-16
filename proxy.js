require('dotenv').config();
const express = require('express');
const https = require('https');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

console.log('🛠 Starting proxy.js...');
console.log('🧪 Creating DB Pool...');

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT, 10),
});

console.log('🧪 DB Pool created');

// 🧠 Fetch server + token from DB
async function getAuthInfo() {
  try {
    const result = await pool.query('SELECT server, ph_auth_token FROM configurations LIMIT 1');
    if (result.rows.length === 0) throw new Error('No config found in DB');
    const { server, ph_auth_token } = result.rows[0];
    console.log(`🔗 SOAR target from DB: ${server}`);
    return { server, token: ph_auth_token };
  } catch (err) {
    console.error('❌ DB error:', err.message);
    process.exit(1);
  }
}

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, ph-auth-token'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Logging
app.use(express.json());
app.use((req, res, next) => {
  console.log(`📩 Incoming Request: ${req.method} ${req.originalUrl}`);
  console.log('🧾 Incoming Headers:', req.headers);
  next();
});

// Manual proxy handler
(async () => {
  const { server, token } = await getAuthInfo();

  const targetHost = new URL(server).hostname;
  const targetPort = 443;

  app.all('/proxy/*', (req, res) => {
    const path = req.originalUrl.replace(/^\/proxy/, '');
    const options = {
      hostname: targetHost,
      port: targetPort,
      path,
      method: req.method,
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'ph-auth-token': token,
      },
    };

    console.log(`➡️ ${req.method} ${path}`);
    console.log(`🔐 Injected Token: ${token}`);

    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        res.status(proxyRes.statusCode).send(data);
      });
    });

    proxyReq.on('error', err => {
      console.error('❌ Proxy Error:', err.message);
      res.status(500).send('Proxy Error: ' + err.message);
    });

    if (req.body && Object.keys(req.body).length > 0) {
      proxyReq.write(JSON.stringify(req.body));
    }

    proxyReq.end();
  });

  app.listen(PORT, () => {
    console.log(`✅ Proxy running at http://localhost:${PORT} → ${server}`);
  });
})();
