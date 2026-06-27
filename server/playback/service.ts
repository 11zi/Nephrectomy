import {
  MAX_QUEUE_LENGTH,
  PlaybackErrors,
  REMOVE_VOTE_THRESHOLD,
  REQUEST_COOLDOWN_MS,
  type PlaybackStatePayload,
  type RoomPlaybackState,
} from './types'
import { parseMediaUrl } from './parser'

const states = new Map<string, RoomPlaybackState>()
const lastRequestAtByUser = new Map<string, number>()

function createEmptyState(roomId: string): RoomPlaybackState {
  return {
    roomId,
    queue: [],
    status: 'idle',
    updatedAt: Date.now(),
  }
}

function cloneState(state: RoomPlaybackState): RoomPlaybackState {
  return {
    ...state,
    queue: state.queue.map(item => ({
      ...item,
      removeVotes: [...item.removeVotes],
    })),
  }
}

function getMutableState(roomId: string): RoomPlaybackState {
  let state = states.get(roomId)
  if (!state) {
    state = createEmptyState(roomId)
    states.set(roomId, state)
  }
  return state
}

function beginPlayback(state: RoomPlaybackState, itemId?: string): void {
  const currentItem = itemId
    ? state.queue.find(item => item.id === itemId)
    : state.queue[0]

  if (!currentItem) {
    state.currentItemId = undefined
    state.status = 'idle'
    state.startedAtServerTime = undefined
    state.offsetWhenStarted = undefined
    state.pausedAt = undefined
    state.updatedAt = Date.now()
    return
  }

  state.currentItemId = currentItem.id
  state.status = 'playing'
  state.startedAtServerTime = Date.now()
  state.offsetWhenStarted = 0
  state.pausedAt = undefined
  state.updatedAt = Date.now()
}

function switchToNextMedia(state: RoomPlaybackState, fromItemId?: string): void {
  if (!fromItemId) {
    beginPlayback(state, state.queue[0]?.id)
    return
  }

  const currentIndex = state.queue.findIndex(item => item.id === fromItemId)
  if (currentIndex >= 0) {
    state.queue.splice(currentIndex, 1)
    beginPlayback(state, state.queue[currentIndex]?.id)
    return
  }

  beginPlayback(state, state.queue[0]?.id)
}

export function getPlaybackState(roomId: string): PlaybackStatePayload {
  return {
    ...cloneState(getMutableState(roomId)),
    serverNow: Date.now(),
  }
}

export function addMediaToQueue(roomId: string, url: string, userId: string): PlaybackStatePayload & { itemId: string } {
  const now = Date.now()
  const lastRequestAt = lastRequestAtByUser.get(userId) ?? 0
  if (now - lastRequestAt < REQUEST_COOLDOWN_MS) {
    throw new Error(PlaybackErrors.RATE_LIMITED)
  }

  const state = getMutableState(roomId)
  if (state.queue.length >= MAX_QUEUE_LENGTH) {
    throw new Error(PlaybackErrors.QUEUE_FULL)
  }

  const item = parseMediaUrl(url, userId)
  state.queue.push(item)
  lastRequestAtByUser.set(userId, now)

  if (!state.currentItemId || state.status === 'idle') {
    beginPlayback(state, item.id)
  } else {
    state.updatedAt = Date.now()
  }

  return {
    ...getPlaybackState(roomId),
    itemId: item.id,
  }
}

export function voteRemoveMedia(roomId: string, itemId: string, userId: string): PlaybackStatePayload & {
  itemRemoved: boolean
  voteAdded: boolean
} {
  const state = getMutableState(roomId)
  const item = state.queue.find(queueItem => queueItem.id === itemId)
  if (!item) throw new Error('点播项不存在')

  let voteAdded = false
  const existingVoteIndex = item.removeVotes.indexOf(userId)
  if (existingVoteIndex >= 0) {
    item.removeVotes.splice(existingVoteIndex, 1)
  } else {
    item.removeVotes.push(userId)
    voteAdded = true
  }

  const itemRemoved = item.removeVotes.length >= REMOVE_VOTE_THRESHOLD
  if (itemRemoved) {
    if (state.currentItemId === itemId) {
      switchToNextMedia(state, itemId)
    } else {
      state.queue = state.queue.filter(queueItem => queueItem.id !== itemId)
      state.updatedAt = Date.now()
    }
  } else {
    state.updatedAt = Date.now()
  }

  return {
    ...getPlaybackState(roomId),
    itemRemoved,
    voteAdded,
  }
}

export function markCurrentMediaEnded(roomId: string, itemId: string): PlaybackStatePayload {
  const state = getMutableState(roomId)
  if (state.currentItemId !== itemId) {
    return getPlaybackState(roomId)
  }

  switchToNextMedia(state, itemId)
  return getPlaybackState(roomId)
}
