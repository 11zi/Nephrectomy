import mongoose, { Schema, type Document } from 'mongoose'

/** 消息中嵌入的发件人摘要（对应前端 UserSummary） */
export interface ISenderSummary {
  id: string
  nickname: string
  avatarUrl: string
  motto?: string
}

export interface IMessage extends Document {
  messageId: string
  roomId: string
  kind: 'user' | 'state' | 'command'
  sender: ISenderSummary
  content: string
  createdAt: Date
  replyToId: string | null
  mentionedUserIds: string[]
  canRecall: boolean
}

const SenderSummarySchema = new Schema<ISenderSummary>(
  {
    id: { type: String, required: true },
    nickname: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    motto: { type: String },
  },
  { _id: false },
)

const MessageSchema = new Schema<IMessage>(
  {
    messageId: { type: String, required: true, unique: true },
    roomId: { type: String, required: true, index: true },
    kind: { type: String, enum: ['user', 'state', 'command'], default: 'user' },
    sender: { type: SenderSummarySchema, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    replyToId: { type: String, default: null },
    mentionedUserIds: { type: [String], default: [] },
    canRecall: { type: Boolean, default: true },
  },
  { timestamps: false },
)

MessageSchema.index({ roomId: 1, createdAt: -1, _id: -1 })

export const Message = mongoose.model<IMessage>('Message', MessageSchema)
