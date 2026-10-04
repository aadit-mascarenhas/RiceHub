import http from 'http'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import connectDB from './config/db.js'
import authRouter from './routes/auth.js'
import ricesRouter from './routes/rices.js'
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/errorHandler.js'
import { attachComments } from './realtime/comments.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')

app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())
// Strips $ / . keys from req.body, req.query, req.params (NoSQL operator
// injection such as { likes: { $gt: "" } } or ?distro[$ne]=).
app.use(mongoSanitize())

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.split('?')[0] === '/api/health',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests — try again in a minute',
    })
  },
})
app.use('/api', apiLimiter)

app.use('/api/auth', authRouter)
app.use('/api/rices', ricesRouter)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use('/api', notFound)

app.use(errorHandler)

const start = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('MISSING_JWT_SECRET: add JWT_SECRET to backend/.env (see .env.example)')
    process.exit(1)
  }
  await connectDB()

  // One HTTP server backs both Express and Socket.IO.
  const server = http.createServer(app)
  const io = new Server(server, { cors: { origin: CORS_ORIGIN } })
  app.set('io', io)
  attachComments(io)

  server.listen(PORT, () => {
    console.log(`SERVER_RUNNING: http://localhost:${PORT}`)
  })
}

start()
