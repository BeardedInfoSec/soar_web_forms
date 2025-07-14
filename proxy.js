const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const target = process.env.TARGET_URL || 'https://192.168.128.72';

app.use(
  '/proxy',
  createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false, // Disable SSL verification
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
  console.log(`Proxy running on http://localhost:${PORT}`);
});
