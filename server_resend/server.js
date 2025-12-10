import express from 'express';
import cors from 'cors';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import forwardHandler from './api/forward.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/media', express.static('/media'));

// Python backend URL
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';
console.log(`[Server] Python backend at: ${PY_BACKEND}`);

// Create proxy ONCE globally
const apiProxy = createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // Keep /api prefix for FastAPI
  },
  ws: false,
  timeout: 30000,
  proxyTimeout: 30000,
});

// Email forwarding (Node.js handler)
app.post('/api/forward', forwardHandler);

// Proxy all other /api/* to Python backend
app.use('/api/', apiProxy);

// Static React build
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api|media).*/, (_, res) =>
  res.sendFile(path.join(dist, 'index.html'))
);

app.listen(port, () => {
  console.log(`[Server] Listening on ${port}`);
});
