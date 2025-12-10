import 'dotenv/config';          // ← loads .env into process.env

import express from 'express';
import cors    from 'cors';
import path    from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';

const app  = express();
const port = process.env.PORT || 3000;   // Dokku/Heroku will inject PORT

app.use(cors());
app.use(express.json());
app.use('/media', express.static('/media')); // static media files from VPS assets

// --- API -----------
// Email forwarding (Node.js handler)
app.post('/api/forward', forwardHandler);

// Proxy all other /api/* to Python backend
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';
console.log(`[Server] Python backend at: ${PY_BACKEND}`);

const apiProxy = createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: true,
  pathRewrite: (path) => '/api' + path,  // Add /api prefix back for FastAPI
  onProxyReq(proxyReq, req, res) {
    if (req.body && typeof req.body === 'object') {
      const body = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
      proxyReq.write(body);
    }
  }
});

app.use('/api/', (req, res, next) => {
  if (req.path === '/forward') {
    return next();  // /api/forward handled locally above
  }
  apiProxy(req, res, next);
});

// --- Static React build -----------
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_, res) =>
  res.sendFile(path.join(dist, 'index.html'))
);

app.listen(port, () => console.log(`Server listening on ${port}`));
