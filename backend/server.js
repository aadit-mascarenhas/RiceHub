import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import connectDB from './config/db.js'
import ricesRouter from './routes/rices.js'
import errorHandler from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/rices', ricesRouter)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use(errorHandler)

const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`SERVER_RUNNING: http://localhost:${PORT}`)
  })
}

start()
