import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const app  = express();
const port = process.env.PORT || 5000;

const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000';

app.use(morgan('dev'));

// ⬇️ IMPORTANT: Express strips '/api' from req.url; put it back with pathRewrite
app.use('/api', createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: false,
  logLevel: 'debug',
  pathRewrite: (path/* e.g. '/chat' */) => '/api' + path, // -> '/api/chat'
}));

// serve media volume
app.use('/media', express.static('/media'));

// serve SPA
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => {
  console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`);
});
