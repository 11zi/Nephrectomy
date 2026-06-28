import { Router } from 'express'
import { authRequired } from '../auth/middleware'
import { User } from '../models/User'
import { bankStatusFromUser, settleDepositInterest } from '../bank/service'

const router = Router()

function parseAmount(value: unknown): number | null {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.floor(amount)
}

function parseDiceAmount(value: unknown): number | null {
  const amount = Number(value)
  if (!Number.isInteger(amount) || amount < 1) return null
  return amount
}

async function findCurrentUser(userId?: string) {
  if (!userId) return null
  return User.findOne({ uid: userId })
}

// GET /api/bank
router.get('/', authRequired, async (req, res) => {
  try {
    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })

    await settleDepositInterest(user)
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          bankDeposit: user.bankDeposit,
          bankInterestSettledAt: user.bankInterestSettledAt,
        },
      },
    )

    res.json(bankStatusFromUser(user))
  } catch (err) {
    console.error('[bank] fetch error:', err)
    res.status(500).json({ error: '获取银行信息失败' })
  }
})

// POST /api/bank/deposit
router.post('/deposit', authRequired, async (req, res) => {
  try {
    const amount = parseAmount(req.body?.amount)
    if (!amount) return res.status(400).json({ error: '存入金额需要是正整数' })

    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })

    await settleDepositInterest(user)
    if ((user.money ?? 0) < amount) {
      return res.status(400).json({ error: '余额不足' })
    }

    user.money -= amount
    user.bankDeposit = (user.bankDeposit ?? 0) + amount
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          money: user.money,
          bankDeposit: user.bankDeposit,
          bankInterestSettledAt: user.bankInterestSettledAt,
        },
      },
    )

    res.json(bankStatusFromUser(user))
  } catch (err) {
    console.error('[bank] deposit error:', err)
    res.status(500).json({ error: '存入失败' })
  }
})

// POST /api/bank/withdraw
router.post('/withdraw', authRequired, async (req, res) => {
  try {
    const amount = parseAmount(req.body?.amount)
    if (!amount) return res.status(400).json({ error: '提取金额需要是正整数' })

    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })

    await settleDepositInterest(user)
    if ((user.bankDeposit ?? 0) < amount) {
      return res.status(400).json({ error: '存款不足' })
    }

    user.bankDeposit -= amount
    user.money = (user.money ?? 0) + amount
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          money: user.money,
          bankDeposit: user.bankDeposit,
          bankInterestSettledAt: user.bankInterestSettledAt,
        },
      },
    )

    res.json(bankStatusFromUser(user))
  } catch (err) {
    console.error('[bank] withdraw error:', err)
    res.status(500).json({ error: '提取失败' })
  }
})

// POST /api/bank/dice
router.post('/dice', authRequired, async (req, res) => {
  try {
    const amount = parseDiceAmount(req.body?.amount)
    if (!amount) return res.status(400).json({ error: '骰子金额需要是大于等于 1 的整数' })

    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })

    await settleDepositInterest(user)
    const currentMoney = Math.floor(user.money ?? 0)
    if (amount >= currentMoney) {
      return res.status(400).json({ error: '骰子金额必须小于当前余额' })
    }

    const won = Math.random() < 0.5
    const delta = won ? amount : -amount
    user.money = currentMoney + delta
    await User.updateOne(
      { uid: user.uid },
      {
        $set: {
          money: user.money,
          bankDeposit: user.bankDeposit,
          bankInterestSettledAt: user.bankInterestSettledAt,
        },
      },
    )

    res.json({
      ...bankStatusFromUser(user),
      dice: {
        amount,
        won,
        delta,
      },
    })
  } catch (err) {
    console.error('[bank] dice error:', err)
    res.status(500).json({ error: '骰子结算失败' })
  }
})

export default router
