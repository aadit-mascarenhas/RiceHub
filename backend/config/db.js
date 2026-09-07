import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MONGODB_CONNECTED: ${conn.connection.host}`)
  } catch (err) {
    console.error(`MONGODB_ERROR: ${err.message}`)
    process.exit(1)
  }
}

export default connectDB
