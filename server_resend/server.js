import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import forwardHandler from './api/forward.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/media', express.static('/media'));

// Direct test endpoint
app.post('/api/chat', (req, res) => {
  console.log('Chat request:', req.body);
  res.json({
    thread_id: 1,
    response: "Test response",
    elapsed_ms: 10,
    messages: [
      {"type": "user", "content": req.body.message || ""},
      {"type": "bot", "content": "Test response"}
    ]
  });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({"status": "ok", "faq_count": 0});
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
