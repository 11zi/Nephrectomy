export interface BankStatus {
  cash: number
  deposit: number
  totalAssets: number
  pendingPassiveMinutes: number
  lastInterestSettledAt: string
}

export interface BankTransferPayload {
  amount: number
}

export interface DiceResult extends BankStatus {
  dice: {
    amount: number
    won: boolean
    delta: number
  }
}
