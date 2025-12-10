import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import forwardHandler from './api/forward.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/media', express.static('/media'));

const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';
console.log(`[Server] Python backend at: ${PY_BACKEND}`);

// Helper to forward request to Python backend
function forwardToPython(method, path, body, res) {
  const url = new URL(PY_BACKEND);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      res.status(proxyRes.statusCode);
      res.set('Content-Type', 'application/json');
      res.send(data);
    });
  });
  
  req.on('error', (err) => {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Bad Gateway' });
  });
  
  if (body) {
    req.write(JSON.stringify(body));
  }
  req.end();
}

// Email forwarding (Node.js handler)
app.post('/api/forward', forwardHandler);

// Proxy GET endpoints
app.get('/api/health', (req, res) => {
  forwardToPython('GET', '/api/health', null, res);
});

app.get('/api/debug/sim', (req, res) => {
  forwardToPython('GET', `/api/debug/sim?q=${req.query.q || ''}`, null, res);
});

// Proxy POST endpoints
app.post('/api/chat', (req, res) => {
  forwardToPython('POST', '/api/chat', req.body, res);
});

app.post('/api/debug/echo', (req, res) => {
  forwardToPython('POST', '/api/debug/echo', req.body, res);
});

// Static files
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api|media).*/, (_, res) =>
  res.sendFile(path.join(dist, 'index.html'))
);

app.listen(port, () => {
  console.log(`[Server] Listening on ${port}`);
});
