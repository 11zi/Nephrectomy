import type { RoomId, UserId } from './chatTypes'

export type MediaType = 'video' | 'music'
export type MediaSource = 'youtube' | 'direct'
export type PlaybackStatus = 'idle' | 'playing' | 'paused'

export interface MediaItem {
  id: string
  type: MediaType
  source: MediaSource
  originalUrl: string
  embedUrl?: string
  directUrl?: string
  youtubeVideoId?: string
  title: string
  duration?: number
  requestedBy: UserId
  requestedAt: number
  removeVotes: UserId[]
}

export interface RoomPlaybackState {
  roomId: RoomId
  queue: MediaItem[]
  currentItemId?: string
  status: PlaybackStatus
  startedAtServerTime?: number
  offsetWhenStarted?: number
  pausedAt?: number
  updatedAt: number
}

export interface PlaybackStatePayload extends RoomPlaybackState {
  serverNow: number
}

export interface PlaybackSocketEvent {
  type: 'PLAYBACK_STATE'
  playback: PlaybackStatePayload
  serverNow: number
}

export interface SubmitPlaybackUrlResult {
  ok: true
  item: MediaItem
  playback: PlaybackStatePayload
}

export interface VoteRemovePlaybackItemResult {
  ok: true
  itemRemoved: boolean
  voteAdded: boolean
  requesterCut: boolean
  playback: PlaybackStatePayload
}

export interface NotifyCurrentEndedResult {
  ok: true
  playback: PlaybackStatePayload
}

export const REMOVE_VOTE_THRESHOLD = 3
