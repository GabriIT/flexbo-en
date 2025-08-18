import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';

const app = express();
const port = process.env.PORT || 3000;
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000'; // uvicorn inside same container

app.use(cors());
app.use(express.json());


// proxy the Python API
app.use(
  ['/api/health', '/api/chat', '/api/thread', '/api/thread/*'],
  createProxyMiddleware({ target: PY_BACKEND, changeOrigin: false })
);


// Simple, direct health endpoint (no DB, no Python)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});


// keep contact form on Node
app.post('/api/forward', forwardHandler);

// proxy the Python API
app.use(
  ['/api/health', '/api/chat', '/api/thread', '/api/thread/*'],
  createProxyMiddleware({ target: PY_BACKEND, changeOrigin: false })
);

// serve built React SPA
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`));
