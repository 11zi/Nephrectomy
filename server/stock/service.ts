import { Stock, type IStock } from '../models/Stock'
import { User } from '../models/User'

export const STOCK_SYMBOL = 'NEPH'
export const BUY_TAX_RATE = 0.015
export const SELL_TAX_RATE = 0.005

const UPDATE_INTERVAL_SECONDS = 60
const MEAN_REVERSION_TARGET = 1.0
const MEAN_REVERSION_STRENGTH = 0.10
const RANDOM_VOLATILITY = 0.02
const RANDOM_BIAS = 0.001
const INITIAL_PRICE = 1.0
const INITIAL_CRASH_PRICE = 0.10
const INITIAL_PEAK_PRICE = 10.0
const CRASH_PRICE_RATIO = 1.1
const PEAK_PRICE_RATIO = 0.9
const RECENT_WINDOW = 120
const CRASH_CATCHUP_SPEED = 0.02
const PEAK_CATCHUP_SPEED = 0.02
const MIN_STEP = 0.0005
const BULL_CANCEL_STREAK = 4
const BULL_CANCEL_PULLBACK = 0.5
const MAX_CATCH_UPDATES = 240

export interface StockStatus {
  symbol: string
  name: string
  price: number
  buyPrice: number
  sellPrice: number
  crashPrice: number
  peakPrice: number
  isBull: boolean
  isCrashed: boolean
  updatedAt: string
  user: {
    cash: number
    shares: number
    autoBuyPrice: number | null
    autoSellPrice: number | null
  }
}

export interface TradeResult extends StockStatus {
  trade: {
    kind: 'buy' | 'sell'
    shares: number
    gross: number
    tax: number
    total: number
  }
}

function roundPrice(value: number): number {
  return Number(Math.max(0.001, value).toFixed(4))
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function asMoney(value: number): number {
  return Math.floor(Math.max(0, value))
}

function nextPrice(currentPrice: number): number {
  const reversion = (MEAN_REVERSION_TARGET - currentPrice) * MEAN_REVERSION_STRENGTH
  const noisePercent = randomBetween(-RANDOM_VOLATILITY, RANDOM_VOLATILITY)
  const noiseBias = randomBetween(-RANDOM_BIAS, RANDOM_BIAS)
  const noise = currentPrice * noisePercent + noiseBias
  return roundPrice(currentPrice + reversion + noise)
}

function updateCrashPrice(stock: IStock): number {
  if (stock.isCrashed) return stock.crashPrice
  const recentLow = stock.priceHistory.length ? Math.min(...stock.priceHistory) : stock.price
  const target = recentLow * CRASH_PRICE_RATIO
  if (target <= stock.crashPrice) return stock.crashPrice
  const diff = target - stock.crashPrice
  return roundPrice(stock.crashPrice + Math.max(diff * CRASH_CATCHUP_SPEED, MIN_STEP))
}

function updatePeakPrice(stock: IStock): number {
  if (stock.isCrashed) return stock.peakPrice
  const recentHigh = stock.priceHistory.length ? Math.max(...stock.priceHistory) : stock.price
  const target = recentHigh * PEAK_PRICE_RATIO
  if (target >= stock.peakPrice) return stock.peakPrice
  const diff = stock.peakPrice - target
  return roundPrice(stock.peakPrice - Math.max(diff * PEAK_CATCHUP_SPEED, MIN_STEP))
}

function updateStockOnce(stock: IStock, now = new Date()): void {
  if (stock.isCrashed) {
    stock.price = nextPrice(stock.price)
    stock.crashPrice = updateCrashPrice(stock)
    stock.lastUpdatedAt = now
    return
  }

  stock.price = nextPrice(stock.price)
  stock.priceHistory.push(stock.price)
  if (stock.priceHistory.length > RECENT_WINDOW) {
    stock.priceHistory.splice(0, stock.priceHistory.length - RECENT_WINDOW)
  }

  stock.crashPrice = updateCrashPrice(stock)
  if (stock.price < stock.crashPrice) {
    stock.isCrashed = true
    stock.isBull = false
    stock.lastUpdatedAt = now
    return
  }

  stock.peakPrice = updatePeakPrice(stock)
  if (stock.price > stock.peakPrice) {
    stock.isBull = true
  }

  if (stock.isBull) {
    if (stock.price < stock.prevPrice) {
      stock.consecutiveDown += 1
    } else {
      stock.consecutiveDown = 0
    }

    if (stock.consecutiveDown >= BULL_CANCEL_STREAK) {
      stock.isBull = false
      stock.consecutiveDown = 0
      stock.peakPrice = roundPrice(
        stock.peakPrice * BULL_CANCEL_PULLBACK + stock.price * BULL_CANCEL_PULLBACK,
      )
    }
  }

  stock.prevPrice = stock.price
  stock.lastUpdatedAt = now
}

export function buyTotalFor(stock: Pick<IStock, 'price'>, shares: number) {
  const gross = stock.price * shares
  const tax = gross * BUY_TAX_RATE
  return {
    gross,
    tax,
    total: Math.ceil(gross + tax),
  }
}

export function sellTotalFor(stock: Pick<IStock, 'price'>, shares: number) {
  const gross = stock.price * shares
  const tax = gross * SELL_TAX_RATE
  return {
    gross,
    tax,
    total: Math.floor(Math.max(0, gross - tax)),
  }
}

export async function ensureStock(): Promise<IStock> {
  const stock = await Stock.findOne({ symbol: STOCK_SYMBOL })
  if (stock) return stock
  return Stock.create({
    symbol: STOCK_SYMBOL,
    name: '肾股',
    price: INITIAL_PRICE,
    crashPrice: INITIAL_CRASH_PRICE,
    peakPrice: INITIAL_PEAK_PRICE,
    isBull: false,
    isCrashed: false,
    priceHistory: [INITIAL_PRICE],
    consecutiveDown: 0,
    prevPrice: INITIAL_PRICE,
    lastUpdatedAt: new Date(),
  })
}

export async function updateStockDue(now = new Date()): Promise<IStock> {
  const stock = await ensureStock()
  const elapsedUpdates = Math.floor(
    (now.getTime() - new Date(stock.lastUpdatedAt).getTime()) / (UPDATE_INTERVAL_SECONDS * 1000),
  )
  const updates = Math.min(MAX_CATCH_UPDATES, Math.max(0, elapsedUpdates))
  for (let i = 0; i < updates; i += 1) {
    updateStockOnce(stock, new Date(new Date(stock.lastUpdatedAt).getTime() + UPDATE_INTERVAL_SECONDS * 1000))
  }
  if (updates > 0) {
    await stock.save()
    await runAutoTrades(stock)
  }
  return stock
}

export async function tickStock(now = new Date()): Promise<IStock> {
  const stock = await ensureStock()
  updateStockOnce(stock, now)
  await stock.save()
  await runAutoTrades(stock)
  return stock
}

export async function runAutoTrades(stock: IStock): Promise<void> {
  const users = await User.find({
    $or: [
      { stockAutoBuyPrice: { $ne: null } },
      { stockAutoSellPrice: { $ne: null } },
    ],
  })

  for (const user of users) {
    const autoSellPrice = user.stockAutoSellPrice
    if (autoSellPrice !== null && autoSellPrice !== undefined && stock.price >= autoSellPrice) {
      const shares = Math.floor(user.stockShares ?? 0)
      if (shares > 0) {
        const sale = sellTotalFor(stock, shares)
        user.stockShares = 0
        user.money = asMoney((user.money ?? 0) + sale.total)
        await user.save()
        continue
      }
    }

    const autoBuyPrice = user.stockAutoBuyPrice
    if (
      !stock.isCrashed
      && autoBuyPrice !== null
      && autoBuyPrice !== undefined
      && stock.price <= autoBuyPrice
    ) {
      const unitCost = buyTotalFor(stock, 1).total
      const shares = Math.floor((user.money ?? 0) / Math.max(1, unitCost))
      if (shares > 0) {
        const purchase = buyTotalFor(stock, shares)
        if ((user.money ?? 0) >= purchase.total) {
          user.money = asMoney((user.money ?? 0) - purchase.total)
          user.stockShares = Math.floor(user.stockShares ?? 0) + shares
          await user.save()
        }
      }
    }
  }
}

export function stockStatusFrom(stock: IStock, user: any): StockStatus {
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: roundPrice(stock.price),
    buyPrice: roundPrice(stock.price * (1 + BUY_TAX_RATE)),
    sellPrice: roundPrice(stock.price * (1 - SELL_TAX_RATE)),
    crashPrice: roundPrice(stock.crashPrice),
    peakPrice: roundPrice(stock.peakPrice),
    isBull: stock.isBull,
    isCrashed: stock.isCrashed,
    updatedAt: stock.lastUpdatedAt.toISOString(),
    user: {
      cash: asMoney(user.money ?? 0),
      shares: Math.floor(user.stockShares ?? 0),
      autoBuyPrice: user.stockAutoBuyPrice ?? null,
      autoSellPrice: user.stockAutoSellPrice ?? null,
    },
  }
}
