import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';   // <-- import your handler

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 5000;
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';

app.use(morgan('dev'));
app.use(express.json());                     // <-- parse JSON bodies

// 1) Contact form stays on Node (must be BEFORE the proxy)
app.post('/api/forward', forwardHandler);

// 2) Only proxy Python endpoints (not /api/forward)
const apiProxy = createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: false,
  logLevel: 'debug',
  // incoming path after mount is like '/chat' → rewrite to '/api/chat'
  pathRewrite: { '^/': '/api/' },
});
app.use('/api/chat', apiProxy);
app.use('/api/thread', apiProxy);
app.use('/api/knowledge', apiProxy);  // if you need to call reload from UI/tools
app.use('/api/debug', apiProxy);

// 3) Serve media volume
app.use('/media', express.static('/media'));

// 4) Serve SPA
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`);
});
