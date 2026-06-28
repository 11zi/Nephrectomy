import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { connectDb } from './db'
import roomsRouter from './routes/rooms'
import messagesRouter from './routes/messages'
import profileRouter from './routes/profile'
import authRouter from './routes/auth'
import bankRouter from './routes/bank'
import stockRouter from './routes/stock'
import playbackRouter from './routes/playback'
import { msUntilNextUtcMidnight, settleAllDepositInterest } from './bank/service'
import { ensureStock, tickStock } from './stock/service'
import { initRealtime } from './realtime'

const PORT = Number(process.env.API_PORT) || 3001

const app = express()
const httpServer = createServer(app)

function scheduleDailyBankInterest() {
  setTimeout(async () => {
    try {
      await settleAllDepositInterest()
    } catch (err) {
      console.error('[bank] daily interest settlement failed:', err)
    } finally {
      scheduleDailyBankInterest()
    }
  }, msUntilNextUtcMidnight())
}

function scheduleStockUpdates() {
  setInterval(async () => {
    try {
      await tickStock()
    } catch (err) {
      console.error('[stock] scheduled update failed:', err)
    }
  }, 60_000)
}

app.use(cors())

// JSON 解析
app.use(express.json({ strict: false }))
app.use(express.urlencoded({ extended: true }))

// 路由挂载
app.use('/api/auth', authRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/rooms', messagesRouter)
app.use('/api/profile', profileRouter)
app.use('/api/bank', bankRouter)
app.use('/api/stock', stockRouter)
app.use('/api/rooms', playbackRouter)

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// ── 全局错误处理 ──
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] unhandled error:', err)
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: '请求数据格式错误' })
  }
  res.status(500).json({ error: '服务器内部错误' })
})

async function start() {
  await connectDb()
  await settleAllDepositInterest()
  await ensureStock()
  scheduleDailyBankInterest()
  scheduleStockUpdates()
  initRealtime(httpServer)
  httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`)
  })
}

start()
