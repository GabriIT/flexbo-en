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

// Only parse JSON on the Node-handled contact route
app.post('/api/forward', express.json(), forwardHandler);

// ✅ Direct echo on Express (NO proxy) just for debugging
app.post('/api/debug/echo', express.json(), (req, res) => {
  console.log('[ECHO:EXPRESS]', req.headers['x-api-key'], req.body);
  res.json({ ok: true, layer: 'express', body: req.body });
});

// One proxy for everything else under /api (AFTER the direct routes above)
const apiProxy = createProxyMiddleware({
  target: PY_BACKEND,          // e.g. http://127.0.0.1:8000
  changeOrigin: false,
  logLevel: 'debug',
  // Express removes '/api' from req.path; add it back so FastAPI sees '/api/...'
  pathRewrite: (path) => '/api' + path, // '/chat' -> '/api/chat', '/debug/sim' -> '/api/debug/sim'
  onProxyReq(proxyReq, req, res) {
    console.log('[PROXY:REQ]', req.method, req.originalUrl, '→', proxyReq.path);
    const body = req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : null;
    // If someone accidentally attached a body parser before the proxy, re-send the body
    if (body) {
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
      proxyReq.write(body);
    }
  },
  onProxyRes(proxyRes, req, res) {
    console.log('[PROXY:RES]', req.method, req.originalUrl, '←', proxyRes.statusCode);
  },
  onError(err, req, res) {
    console.error('[PROXY:ERROR]', req.method, req.originalUrl, err?.message);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error');
  },
});

app.use('/api', apiProxy);


// Media volume
app.use('/media', express.static('/media'));

// SPA
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`);
});
