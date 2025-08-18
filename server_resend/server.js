import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';

const app = express();
const port = process.env.PORT || 3000;
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';

app.use(cors());
app.use(express.json());

// 1) Direct health endpoint (no proxy)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// 2) Keep contact form on Node
app.post('/api/forward', forwardHandler);

// 3) Proxy ONLY the Python API routes (EXCLUDE /api/health)
app.use(
  ['/api/chat', '/api/thread', '/api/thread/*'],
  createProxyMiddleware({ target: PY_BACKEND, changeOrigin: false })
);

// 4) Serve built SPA
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`);
});
