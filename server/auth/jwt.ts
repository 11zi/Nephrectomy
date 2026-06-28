import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'nephrectomy-dev-secret'
const TOKEN_EXPIRY = '7d'

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
    return payload
  } catch {
    return null
  }
}
