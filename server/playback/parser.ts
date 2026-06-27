import { randomUUID } from 'node:crypto'
import { PlaybackErrors, type MediaItem, type MediaType } from './types'

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm'])
const AUDIO_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav', '.flac'])

function getPathExtension(url: URL): string {
  const pathname = url.pathname.toLowerCase()
  const dotIndex = pathname.lastIndexOf('.')
  return dotIndex >= 0 ? pathname.slice(dotIndex) : ''
}

function parseYoutubeVideoId(url: URL): string | null {
  const hostname = url.hostname.replace(/^www\./, '')

  if (hostname === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }

  if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
    if (url.pathname === '/watch') return url.searchParams.get('v')

    const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/)
    if (embedMatch) return embedMatch[1]
  }

  return null
}

function isKnownUnsupportedHost(url: URL): boolean {
  const hostname = url.hostname.replace(/^www\./, '')
  return hostname === 'bilibili.com'
    || hostname === 'b23.tv'
    || hostname === 'music.163.com'
}

export function parseMediaUrl(input: string, userId: string): MediaItem {
  const rawUrl = input.trim()
  if (!rawUrl) throw new Error(PlaybackErrors.EMPTY_URL)

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error(PlaybackErrors.INVALID_URL)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(PlaybackErrors.INVALID_URL)
  }

  const youtubeVideoId = parseYoutubeVideoId(url)
  if (youtubeVideoId) {
    return {
      id: randomUUID(),
      type: 'video',
      source: 'youtube',
      originalUrl: rawUrl,
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(youtubeVideoId)}`,
      youtubeVideoId,
      title: 'YouTube 视频',
      requestedBy: userId,
      requestedAt: Date.now(),
      removeVotes: [],
    }
  }

  if (isKnownUnsupportedHost(url)) {
    throw new Error(PlaybackErrors.UNSUPPORTED_SOURCE)
  }

  const extension = getPathExtension(url)
  let type: MediaType | null = null
  let title = ''

  if (VIDEO_EXTENSIONS.has(extension)) {
    type = 'video'
    title = '直链视频'
  } else if (AUDIO_EXTENSIONS.has(extension)) {
    type = 'music'
    title = '直链音频'
  }

  if (!type) {
    throw new Error(PlaybackErrors.UNSUPPORTED_MEDIA_TYPE)
  }

  return {
    id: randomUUID(),
    type,
    source: 'direct',
    originalUrl: rawUrl,
    directUrl: rawUrl,
    title,
    requestedBy: userId,
    requestedAt: Date.now(),
    removeVotes: [],
  }
}
