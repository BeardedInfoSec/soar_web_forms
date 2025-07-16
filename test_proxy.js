const express = require('express');
const https = require('https');

const app = express();
const PORT = 3001;

const PH_AUTH_TOKEN = 'qiwPrSCLxVf1twsT05kfUsA3O5HdgoElsVyTvwZJIDk=';
const TARGET_HOST = '192.168.128.31';
const TARGET_PORT = 443;

app.use(express.json());

app.all('/proxy/*', (req, res) => {
  const path = req.originalUrl.replace(/^\/proxy/, '');
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: path,
    method: req.method,
    rejectUnauthorized: false, // Ignore self-signed SSL
    headers: {
      'Content-Type': 'application/json',
      'ph-auth-token': PH_AUTH_TOKEN,
    },
  };

  console.log(`➡️ ${req.method} ${path}`);
  console.log(`🔐 Injected Token: ${PH_AUTH_TOKEN}`);

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy Error:', err.message);
    res.status(500).send('Proxy Error: ' + err.message);
  });

  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }

  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`✅ Manual proxy running on http://localhost:${PORT} → https://${TARGET_HOST}`);
});
