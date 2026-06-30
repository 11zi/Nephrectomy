import mongoose, { Schema, type Document } from 'mongoose'

export interface IProfileVisit extends Document {
  targetUserId: string
  visitorUserId: string
  visitDate: string
  createdAt: Date
}

const ProfileVisitSchema = new Schema<IProfileVisit>(
  {
    targetUserId: { type: String, required: true, index: true },
    visitorUserId: { type: String, required: true, index: true },
    visitDate: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

ProfileVisitSchema.index(
  { targetUserId: 1, visitorUserId: 1, visitDate: 1 },
  { unique: true },
)

export const ProfileVisit = mongoose.model<IProfileVisit>('ProfileVisit', ProfileVisitSchema)
