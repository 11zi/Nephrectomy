import mongoose, { Schema, type Document } from 'mongoose'

export interface IRoom extends Document {
  roomId: string
  name: string
  description: string
  ownerId: string | null
  loanBalance: number
  downPayment: number
  memberCount: number
  heat: number
  isActive: boolean
  parentId: string | null
  cover: string
  colSpan: number
  rowSpan: number
}

const RoomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    ownerId: { type: String, default: null },
    loanBalance: { type: Number, default: 0 },
    downPayment: { type: Number, default: 0 },
    memberCount: { type: Number, default: 0 },
    heat: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    parentId: { type: String, default: null },
    cover: { type: String, default: '#546e7a' },
    colSpan: { type: Number, default: 1 },
    rowSpan: { type: Number, default: 1 },
  },
  { timestamps: true },
)

export const Room = mongoose.model<IRoom>('Room', RoomSchema)
