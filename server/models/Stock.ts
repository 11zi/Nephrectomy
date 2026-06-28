import mongoose, { Schema, type Document } from 'mongoose'

export interface IStock extends Document {
  symbol: string
  name: string
  price: number
  crashPrice: number
  peakPrice: number
  isBull: boolean
  isCrashed: boolean
  priceHistory: number[]
  consecutiveDown: number
  prevPrice: number
  lastUpdatedAt: Date
}

const StockSchema = new Schema<IStock>(
  {
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, default: 1 },
    crashPrice: { type: Number, default: 0.1 },
    peakPrice: { type: Number, default: 10 },
    isBull: { type: Boolean, default: false },
    isCrashed: { type: Boolean, default: false },
    priceHistory: { type: [Number], default: [] },
    consecutiveDown: { type: Number, default: 0 },
    prevPrice: { type: Number, default: 1 },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const Stock = mongoose.model<IStock>('Stock', StockSchema)
