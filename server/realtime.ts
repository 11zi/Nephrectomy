import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { verifyToken } from './auth/jwt'
import { User } from './models/User'
import type { IMessage } from './models/Message'
import type { PlaybackStatePayload } from './playback/types'

let io: Server | null = null

const roomChannel = (roomId: string) => `room:${roomId}`
const userChannel = (userId: string) => `user:${userId}`

export function serializeMessage(message: IMessage | any) {
  return {
    id: message.messageId,
    roomId: message.roomId,
    kind: message.kind,
    sender: message.sender,
    content: message.content,
    createdAt: message.createdAt instanceof Date
      ? message.createdAt.toISOString()
      : new Date(message.createdAt).toISOString(),
    replyToId: message.replyToId,
    mentionedUserIds: message.mentionedUserIds,
    canRecall: message.canRecall,
  }
}

export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (typeof token !== 'string') {
      next(new Error('unauthorized'))
      return
    }

    const payload = verifyToken(token)
    if (!payload) {
      next(new Error('unauthorized'))
      return
    }

    socket.data.userId = payload.sub
    next()
  })

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string
    socket.join(userChannel(userId))

    try {
      const user = await User.findOne({ uid: userId }).lean()
      if (user?.currentRoom) {
        socket.join(roomChannel(user.currentRoom))
      }
    } catch (err) {
      console.warn('[socket] failed to join current room:', err)
    }

    socket.on('room:join', (roomId: string) => {
      if (typeof roomId === 'string' && roomId.trim()) {
        socket.join(roomChannel(roomId.trim()))
      }
    })

    socket.on('room:leave', (roomId: string) => {
      if (typeof roomId === 'string' && roomId.trim()) {
        socket.leave(roomChannel(roomId.trim()))
      }
    })
  })

  return io
}

export function emitRoomMessageCreated(message: IMessage | any): void {
  if (!io) return

  const payload = {
    scope: 'room',
    roomId: message.roomId,
    message: serializeMessage(message),
  }

  io.to(roomChannel(message.roomId)).emit('message:created', payload)
}

export function emitRoomMessageDeleted(roomId: string, messageId: string): void {
  if (!io) return

  io.to(roomChannel(roomId)).emit('message:deleted', {
    scope: 'room',
    roomId,
    messageId,
  })
}

export function emitRoomPlaybackState(roomId: string, playback: PlaybackStatePayload): void {
  if (!io) return

  io.to(roomChannel(roomId)).emit('playback:state', {
    type: 'PLAYBACK_STATE',
    playback,
    serverNow: playback.serverNow,
  })
}
