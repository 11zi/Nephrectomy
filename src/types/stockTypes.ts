export interface StockUserStatus {
  cash: number
  shares: number
  autoBuyPrice: number | null
  autoSellPrice: number | null
}

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
  user: StockUserStatus
}

export interface StockTradePayload {
  shares: number
}

export interface StockAutoPayload {
  autoBuyPrice: number | null
  autoSellPrice: number | null
}

export interface StockTradeResult extends StockStatus {
  trade: {
    kind: 'buy' | 'sell'
    shares: number
    gross: number
    tax: number
    total: number
  }
}
