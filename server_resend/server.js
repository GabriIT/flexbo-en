import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app       = express();
const port      = process.env.PORT || 5000;     


import morgan from 'morgan';
app.use(morgan("dev"));

// Dokku maps :5000
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';

// proxy *everything* under /api to FastAPI
app.use("/api", createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: false,
  logLevel: "debug",
}));
app.use("/api", apiProxy);   

app.use(cors());
app.use(express.json());

// 1) DIRECT healthcheck (no proxy)
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// 2) Contact form stays on Node
app.post('/api/forward', forwardHandler);

// 3) Proxy ONLY Python endpoints (do NOT include /api/health)
app.use('/api/chat',   createProxyMiddleware({ target: PY_BACKEND, changeOrigin: false }));
app.use('/api/thread', createProxyMiddleware({ target: PY_BACKEND, changeOrigin: false }));
app.use('/api/thread/:id', createProxyMiddleware({ target: PY_BACKEND, changeOrigin: false }));



// serve the mounted directory at /media
app.use('/media', express.static('/media'));



// 4) Serve SPA
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

// 5) Start Node (FastAPI is started by start.sh)
app.listen(port, () => console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`));
