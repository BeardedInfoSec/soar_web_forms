require('dotenv').config(); // ← Add this line at the top

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const target = process.env.PROXY_TARGET; // ← Read from .env

if (!target) {
  console.error('❌ PROXY_TARGET not set in .env');
  process.exit(1);
}

app.use(
  '/proxy',
  createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false, // Disable SSL verification (if SOAR uses self-signed cert)
    onProxyReq: (proxyReq) => {
      console.log('Proxying request:', proxyReq.path);
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err.message);
      res.status(500).send('Proxy error occurred.');
    },
  })
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔁 Proxy running on http://localhost:${PORT} → ${target}`);
});
