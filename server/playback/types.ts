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
  requestedBy: string
  requestedAt: number
  removeVotes: string[]
}

export interface RoomPlaybackState {
  roomId: string
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

export const PlaybackErrors = {
  EMPTY_URL: '请输入点播链接',
  INVALID_URL: '链接格式不正确',
  UNSUPPORTED_SOURCE: '暂不支持该媒体来源',
  UNSUPPORTED_MEDIA_TYPE: '暂不支持该媒体类型',
  QUEUE_FULL: '点播队列已满',
  RATE_LIMITED: '点播太频繁，请稍后再试',
  PARSE_FAILED: '媒体解析失败',
  NETWORK_ERROR: '网络错误，请稍后再试',
} as const

export const MAX_QUEUE_LENGTH = 50
export const REMOVE_VOTE_THRESHOLD = 3
export const REQUEST_COOLDOWN_MS = 10_000
