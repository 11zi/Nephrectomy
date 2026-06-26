import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/nephrectomy'

export async function connectDb(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('[db] connected to', MONGO_URI)
  } catch (err) {
    console.error('[db] connection failed:', err)
    process.exit(1)
  }
}
