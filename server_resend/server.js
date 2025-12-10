import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 5000;
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';

console.log(`[Server] Python backend at: ${PY_BACKEND}`);

// Parse JSON globally for all routes that need it
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Email forwarding (Node.js handler)
app.post('/api/forward', forwardHandler);

// Proxy all other /api/* to Python backend
const apiProxy = createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: false,
  logLevel: 'warn',
  pathRewrite: (path) => '/api' + path,  // Add /api prefix back for FastAPI
  onProxyReq(proxyReq, req, res) {
    if (req.body && typeof req.body === 'object') {
      const body = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
      proxyReq.write(body);
    }
  },
  onError(err, req, res) {
    console.error('[PROXY:ERROR]', req.method, req.path, err?.message);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  }
});

app.use('/api/', apiProxy);

// Static media files
app.use('/media', express.static('/media'));

// Static React build
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api|media).*/, (_, res) =>
  res.sendFile(path.join(dist, 'index.html'))
);

app.listen(port, () => console.log(`Server listening on ${port}`));
