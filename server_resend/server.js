import 'dotenv/config';          // ← loads .env into process.env

import express from 'express';
import cors    from 'cors';
import path    from 'path';
import forwardHandler from './api/forward.js';

const app  = express();
const port = process.env.PORT || 3000;   // Dokku/Heroku will inject PORT

app.use(cors());
app.use(express.json());
app.use('/media', express.static('/media')); // static media files from VPS assets
// --- API -----------
app.post('/api/forward', forwardHandler);

// serve built React files (prod)
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
// app.get('/*', (_, res) => res.sendFile(path.join(dist, 'index.html')));
app.get(/^\/(?!api).*/, (_, res) =>
      res.sendFile(path.join(dist, 'index.html'))
   );

app.listen(port, () => console.log(`Server listening on ${port}`));

