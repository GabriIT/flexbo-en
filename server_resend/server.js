// server_resend/server.js
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js'; // your email handler

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 5000;
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';

app.use(morgan('dev'));
app.use(express.json()); // needed for /api/forward body parsing

// 1) Contact form stays on Node (place BEFORE the proxy)
app.post('/api/forward', forwardHandler);

// 2) Single proxy for ALL FastAPI endpoints under /api/*
//    Express strips the mount (/api), so the proxy sees e.g. "/chat".
//    We re-prefix "/api" so FastAPI receives "/api/chat".
app.use(
  '/api',
  createProxyMiddleware({
    target: PY_BACKEND,
    changeOrigin: false,
    logLevel: 'debug',
    pathRewrite: (path) => `/api${path}`, // '/chat' -> '/api/chat', '/knowledge/reload' -> '/api/knowledge/reload'
  })
);

// 3) Serve media volume
app.use('/media', express.static('/media'));

// 4) Serve SPA
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`);
});
