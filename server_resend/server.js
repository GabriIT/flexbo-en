// server_resend/server.js

import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import morgan from 'morgan'
import { createProxyMiddleware } from 'http-proxy-middleware'
import forwardHandler from './api/forward.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const app  = express()
const port = process.env.PORT || 5000
const PY_BACKEND = process.env.PY_BACKEND || 'http://127.0.0.1:8000'

app.use(morgan('dev'))
app.use(express.json())

// 1) Keep contact form on Node
app.post('/api/forward', forwardHandler)

// 2) Proxy everything else under /api → FastAPI
app.use('/api', createProxyMiddleware({
  target: PY_BACKEND,
  changeOrigin: false,
  logLevel: 'debug',
  // Express strips the mount path (/api). Add it back so FastAPI sees /api/*
  pathRewrite: (path) => '/api' + path,   // e.g. '/chat' -> '/api/chat'
}))

// 3) Media volume
app.use('/media', express.static('/media'))

// 4) SPA
const dist = path.join(__dirname, '..', 'dist')
app.use(express.static(dist))
app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))

app.listen(port, () => {
  console.log(`Express listening on ${port}, proxy → ${PY_BACKEND}`)
})
