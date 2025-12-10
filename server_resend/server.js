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

// --- API Endpoints ---

// Email forwarding (Node.js handler)
app.post('/api/forward', forwardHandler);

// Proxy all other /api/* to Python backend
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';
console.log(`[Server] Python backend at: ${PY_BACKEND}`);

// Simple proxy for all /api/* routes (except /api/forward which is handled above)
app.use('/api', (req, res, next) => {
  // Skip /api/forward - it's handled locally
  if (req.path === '/forward') {
    return next();
  }
  
  // Proxy everything else to Python
  const proxyMiddleware = createProxyMiddleware({
    target: PY_BACKEND,
    changeOrigin: true,
    pathRewrite: (path) => '/api' + path,
    logLevel: 'debug',  // Enable debug logging
  });
  
  proxyMiddleware(req, res, next);
});

// --- Static React build ---
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api|media).*/, (_, res) =>
  res.sendFile(path.join(dist, 'index.html'))
);

app.listen(port, () => {
  console.log(`[Server] Listening on ${port}`);
});
