import { Router } from 'express'
import { authRequired } from '../auth/middleware'
import { User } from '../models/User'
import {
  buyTotalFor,
  sellTotalFor,
  stockStatusFrom,
  updateStockDue,
  type TradeResult,
} from '../stock/service'

const router = Router()

function parseShares(value: unknown): number | null {
  const shares = Number(value)
  if (!Number.isInteger(shares) || shares < 1) return null
  return shares
}

function parseAutoPrice(value: unknown): number | null {
  if (value === null || value === '' || value === undefined) return null
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return null
  return Number(price.toFixed(4))
}

async function findCurrentUser(userId?: string) {
  if (!userId) return null
  return User.findOne({ uid: userId })
}

router.get('/', authRequired, async (req, res) => {
  try {
    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })

    const stock = await updateStockDue()
    res.json(stockStatusFrom(stock, user))
  } catch (err) {
    console.error('[stock] fetch error:', err)
    res.status(500).json({ error: '获取股票信息失败' })
  }
})

router.post('/buy', authRequired, async (req, res) => {
  try {
    const shares = parseShares(req.body?.shares)
    if (!shares) return res.status(400).json({ error: '买入数量需要是大于等于 1 的整数' })

    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })

    const stock = await updateStockDue()
    if (stock.isCrashed) {
      return res.status(400).json({ error: '股票已崩盘，只能卖出' })
    }

    const purchase = buyTotalFor(stock, shares)
    if ((user.money ?? 0) < purchase.total) {
      return res.status(400).json({ error: '余额不足' })
    }

    user.money = Math.floor((user.money ?? 0) - purchase.total)
    user.stockShares = Math.floor(user.stockShares ?? 0) + shares
    await user.save()

    const result: TradeResult = {
      ...stockStatusFrom(stock, user),
      trade: {
        kind: 'buy',
        shares,
        gross: purchase.gross,
        tax: purchase.tax,
        total: purchase.total,
      },
    }
    res.json(result)
  } catch (err) {
    console.error('[stock] buy error:', err)
    res.status(500).json({ error: '买入失败' })
  }
})

router.post('/sell', authRequired, async (req, res) => {
  try {
    const shares = parseShares(req.body?.shares)
    if (!shares) return res.status(400).json({ error: '卖出数量需要是大于等于 1 的整数' })

    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })
    if ((user.stockShares ?? 0) < shares) {
      return res.status(400).json({ error: '持股不足' })
    }

    const stock = await updateStockDue()
    const sale = sellTotalFor(stock, shares)
    user.stockShares = Math.floor(user.stockShares ?? 0) - shares
    user.money = Math.floor((user.money ?? 0) + sale.total)
    await user.save()

    const result: TradeResult = {
      ...stockStatusFrom(stock, user),
      trade: {
        kind: 'sell',
        shares,
        gross: sale.gross,
        tax: sale.tax,
        total: sale.total,
      },
    }
    res.json(result)
  } catch (err) {
    console.error('[stock] sell error:', err)
    res.status(500).json({ error: '卖出失败' })
  }
})

router.post('/auto', authRequired, async (req, res) => {
  try {
    const autoBuyPrice = parseAutoPrice(req.body?.autoBuyPrice)
    const autoSellPrice = parseAutoPrice(req.body?.autoSellPrice)
    if (
      req.body?.autoBuyPrice !== null
      && req.body?.autoBuyPrice !== ''
      && req.body?.autoBuyPrice !== undefined
      && autoBuyPrice === null
    ) {
      return res.status(400).json({ error: '自动买入价需要是大于 0 的数字' })
    }
    if (
      req.body?.autoSellPrice !== null
      && req.body?.autoSellPrice !== ''
      && req.body?.autoSellPrice !== undefined
      && autoSellPrice === null
    ) {
      return res.status(400).json({ error: '自动卖出价需要是大于 0 的数字' })
    }

    const user = await findCurrentUser(req.userId)
    if (!user) return res.status(404).json({ error: '用户不存在' })

    user.stockAutoBuyPrice = autoBuyPrice
    user.stockAutoSellPrice = autoSellPrice
    await user.save()

    const stock = await updateStockDue()
    res.json(stockStatusFrom(stock, user))
  } catch (err) {
    console.error('[stock] auto error:', err)
    res.status(500).json({ error: '自动价格设置失败' })
  }
})

export default router
