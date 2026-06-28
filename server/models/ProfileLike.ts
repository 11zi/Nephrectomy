import mongoose, { Schema, type Document } from 'mongoose'

export interface IProfileLike extends Document {
  targetUserId: string
  likerUserId: string
  likeDate: string
  createdAt: Date
  likerSnapshot: {
    nickname: string
  }
}

const ProfileLikeSchema = new Schema<IProfileLike>(
  {
    targetUserId: { type: String, required: true, index: true },
    likerUserId: { type: String, required: true, index: true },
    likeDate: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likerSnapshot: {
      nickname: { type: String, required: true },
    },
  },
  { timestamps: false },
)

ProfileLikeSchema.index(
  { targetUserId: 1, likerUserId: 1, likeDate: 1 },
  { unique: true },
)
ProfileLikeSchema.index({ targetUserId: 1, createdAt: -1 })

export const ProfileLike = mongoose.model<IProfileLike>('ProfileLike', ProfileLikeSchema)
