import type {
  NotifyCurrentEndedResult,
  PlaybackStatePayload,
  SubmitPlaybackUrlResult,
  VoteRemovePlaybackItemResult,
} from '../types/playbackTypes'

const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }

  return res.json()
}

export const playbackApi = {
  getPlaybackState(roomId: string): Promise<PlaybackStatePayload> {
    return request<PlaybackStatePayload>(`/rooms/${roomId}/playback`)
  },

  submitPlaybackUrl(roomId: string, url: string): Promise<SubmitPlaybackUrlResult> {
    return request<SubmitPlaybackUrlResult>(`/rooms/${roomId}/playback/queue`, {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  },

  voteRemovePlaybackItem(roomId: string, itemId: string): Promise<VoteRemovePlaybackItemResult> {
    return request<VoteRemovePlaybackItemResult>(`/rooms/${roomId}/playback/queue/${itemId}/vote-remove`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },

  notifyCurrentEnded(roomId: string, itemId: string): Promise<NotifyCurrentEndedResult> {
    return request<NotifyCurrentEndedResult>(`/rooms/${roomId}/playback/current-ended`, {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    })
  },
}
