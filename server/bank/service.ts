import { User } from '../models/User'

const DAY_MS = 24 * 60 * 60 * 1000
const PASSIVE_SETTLEMENT_MINUTES = 30
const PASSIVE_BASE_PER_MINUTE = 1
const DAILY_DEPOSIT_INTEREST = 0.012
const MAX_HEARTBEAT_MINUTES = 2

export interface BankStatus {
  cash: number
  deposit: number
  totalAssets: number
  pendingPassiveMinutes: number
  lastInterestSettledAt: string
}

function asMoney(value: number): number {
  return Math.floor(Math.max(0, value))
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function elapsedUtcMidnights(lastSettledAt: Date | undefined, now: Date): number {
  if (!lastSettledAt) return 0
  const lastDay = startOfUtcDay(lastSettledAt)
  const today = startOfUtcDay(now)
  return Math.max(0, Math.floor((today.getTime() - lastDay.getTime()) / DAY_MS))
}

export function bankStatusFromUser(user: any): BankStatus {
  const cash = asMoney(user.money ?? 0)
  const deposit = asMoney(user.bankDeposit ?? 0)
  const interestSettledAt = user.bankInterestSettledAt instanceof Date
    ? user.bankInterestSettledAt
    : new Date(user.bankInterestSettledAt ?? Date.now())

  return {
    cash,
    deposit,
    totalAssets: cash + deposit,
    pendingPassiveMinutes: Math.max(0, user.bankPassiveMinutes ?? 0),
    lastInterestSettledAt: interestSettledAt.toISOString(),
  }
}

export async function settleDepositInterest(user: any, now = new Date()): Promise<void> {
  const lastSettledAt = user.bankInterestSettledAt
    ? new Date(user.bankInterestSettledAt)
    : startOfUtcDay(now)
  const elapsedDays = elapsedUtcMidnights(lastSettledAt, now)

  if (!user.bankInterestSettledAt) {
    user.bankInterestSettledAt = startOfUtcDay(now)
  }
  if (elapsedDays <= 0) return

  const currentDeposit = asMoney(user.bankDeposit ?? 0)
  user.bankDeposit = asMoney(currentDeposit * Math.pow(1 + DAILY_DEPOSIT_INTEREST, elapsedDays))
  user.bankInterestSettledAt = startOfUtcDay(now)
}

export async function settleAllDepositInterest(now = new Date()): Promise<void> {
  const users = await User.find()
  for (const user of users) {
    await settleDepositInterest(user, now)
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          bankDeposit: user.bankDeposit,
          bankInterestSettledAt: user.bankInterestSettledAt,
        },
      },
    )
  }
}

export function msUntilNextUtcMidnight(now = new Date()): number {
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  ))
  return Math.max(1_000, tomorrow.getTime() - now.getTime())
}

export async function settlePassiveIncome(user: any, now = new Date()): Promise<number> {
  const lastSeenAt = user.lastSeenAt ? new Date(user.lastSeenAt) : now
  const elapsedMinutes = Math.min(
    MAX_HEARTBEAT_MINUTES,
    Math.max(0, (now.getTime() - lastSeenAt.getTime()) / 60_000),
  )

  user.bankPassiveMinutes = Math.max(0, (user.bankPassiveMinutes ?? 0) + elapsedMinutes)
  const chunks = Math.floor(user.bankPassiveMinutes / PASSIVE_SETTLEMENT_MINUTES)
  if (chunks <= 0) return 0

  const settledMinutes = chunks * PASSIVE_SETTLEMENT_MINUTES
  const roomId = user.currentRoom || 'plaza'
  const onlineCount = await User.countDocuments({ currentRoom: roomId, isOnline: true })
  const roomMembers = Math.max(1, onlineCount)
  const perMinute = PASSIVE_BASE_PER_MINUTE + onlineCount / roomMembers
  const income = asMoney(settledMinutes * perMinute)

  user.money = asMoney((user.money ?? 0) + income)
  user.onlineDuration = Math.max(0, (user.onlineDuration ?? 0) + settledMinutes)
  user.bankPassiveMinutes -= settledMinutes
  return income
}
