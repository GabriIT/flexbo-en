import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 5000;
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';

app.use(morgan('dev'));

// ✅ Only parse JSON on the Node-handled route
app.post('/api/forward', express.json(), forwardHandler);

// ✅ One proxy mounted at /api. Do NOT run express.json() before this.
const apiProxy = createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: false,
  logLevel: 'debug',
  // Express strips the mount path (/api). Put it back so FastAPI sees /api/*
  pathRewrite: (path) => '/api' + path,  // '/chat' -> '/api/chat'
  // (Optional) If you ever re-add a body parser before this, uncomment the block below
  // to manually re-send the body upstream.
  /*
  onProxyReq(proxyReq, req) {
    if (req.method === 'POST' &&
        req.headers['content-type']?.includes('application/json') &&
        req.body && typeof req.body === 'object') {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('content-length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
  */
});
app.use('/api', apiProxy);

// Serve the mounted media volume
app.use('/media', express.static('/media'));

// Serve SPA
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`);
});
