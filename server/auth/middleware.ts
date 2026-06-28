import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from './jwt'

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/** 强制要求登录：未认证返回 401 */
export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: '请先登录' })
    return
  }
  const token = header.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    res.status(401).json({ error: '登录已过期，请重新登录' })
    return
  }
  req.userId = payload.sub
  next()
}

/** 可选认证：有 token 则解析，没有也不拦截 */
export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    const payload = verifyToken(header.slice(7))
    if (payload) req.userId = payload.sub
  }
  next()
}
