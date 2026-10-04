import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import connectDB from './config/db.js'
import ricesRouter from './routes/rices.js'
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/errorHandler.js'

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

app.use('/api/rices', ricesRouter)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use('/api', notFound)

app.use(errorHandler)

const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`SERVER_RUNNING: http://localhost:${PORT}`)
  })
}

start()
