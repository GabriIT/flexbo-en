import 'dotenv/config';          // ← loads .env into process.env

import express from 'express';
import cors    from 'cors';
import path    from 'path';
import forwardHandler from './api/forward.js';

// ───────── DEBUG ─ log every mount path ─────────
// import util from 'util';
// const rProto = express.Router.prototype;

// const log = (verb, p) =>
//   console.log(`${verb.padEnd(4)}:`, util.inspect(p, { colors: true }));

// // hook .route(path)
// const _route = rProto.route;
// rProto.route = function (p) { log('GET ', p); return _route.call(this, p); };

// // hook .use([path], fn)
// const _use = rProto.use;
// rProto.use = function (p) {
//   // .use(fn)   → first arg is a function, path defaults to '/'
//   const path = typeof p === 'function' ? '/' : p;
//   log('USE ', path);
//   return _use.apply(this, arguments);
// };
// ────────────────────────────────────────────────


const app  = express();
const port = process.env.PORT || 3000;   // Dokku/Heroku will inject PORT

app.use(cors());
app.use(express.json());
app.use('/media', express.static('/media')); // static media files from VPS assets
// --- API -----------
app.post('/api/forward', forwardHandler);

// --- Static React build -----------
// const dist = path.join(path.resolve(), 'dist');   // vite build output
// app.use(express.static(dist));
// app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));


// serve built React files (prod)
const dist = path.join(path.resolve(), 'dist');
app.use(express.static(dist));
// app.get('/*', (_, res) => res.sendFile(path.join(dist, 'index.html')));
app.get(/^\/(?!api).*/, (_, res) =>
      res.sendFile(path.join(dist, 'index.html'))
   );

app.listen(port, () => console.log(`Server listening on ${port}`));

