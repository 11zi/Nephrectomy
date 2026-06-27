export type ChatMediaKind = 'image' | 'video' | 'audio' | 'iframe'

export interface ChatMediaEmbed {
  kind: ChatMediaKind
  url: string
  title: string
  provider?: string
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.m3u8'])
const AUDIO_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav', '.flac'])
const BRACKET_LINK_RE = /\[(https?:\/\/[^\]\s]+)\]/gi

export function renderMessageMediaLinks(markdown: string): string {
  return markdown.replace(BRACKET_LINK_RE, (token, rawUrl: string) => {
    const embed = classifyChatMediaUrl(rawUrl)
    if (!embed) return token
    return `\n\n${renderChatMediaEmbed(embed)}\n\n`
  })
}

export function classifyChatMediaUrl(rawUrl: string): ChatMediaEmbed | null {
  const parsed = parseHttpUrl(rawUrl)
  if (!parsed) return null

  const platformEmbed = classifyPlatformUrl(parsed)
  if (platformEmbed) return platformEmbed

  const extension = getPathExtension(parsed.pathname)
  if (IMAGE_EXTENSIONS.has(extension)) {
    return {
      kind: 'image',
      url: parsed.href,
      title: '图片',
    }
  }
  if (VIDEO_EXTENSIONS.has(extension)) {
    return {
      kind: 'video',
      url: parsed.href,
      title: extension === '.m3u8' ? 'HLS 视频' : '视频',
    }
  }
  if (AUDIO_EXTENSIONS.has(extension)) {
    return {
      kind: 'audio',
      url: parsed.href,
      title: '音频',
    }
  }

  return null
}

export function renderChatMediaEmbed(embed: ChatMediaEmbed): string {
  const url = escapeAttribute(embed.url)
  const title = escapeAttribute(embed.title)

  if (embed.kind === 'image') {
    return `<img class="chat-media chat-media-image" data-chat-media="true" src="${url}" alt="${title}" loading="lazy" referrerpolicy="no-referrer" />`
  }

  if (embed.kind === 'video') {
    return `<video class="chat-media chat-media-video" data-chat-media="true" src="${url}" controls preload="metadata" playsinline referrerpolicy="no-referrer"></video>`
  }

  if (embed.kind === 'audio') {
    return `<audio class="chat-media chat-media-audio" data-chat-media="true" src="${url}" controls preload="metadata" referrerpolicy="no-referrer"></audio>`
  }

  return `<iframe class="chat-media chat-media-iframe" data-chat-media="true" src="${url}" title="${title}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>`
}

export function isAllowedChatMediaElement(tagName: string, rawUrl: string): boolean {
  const tag = tagName.toLowerCase()
  if (tag === 'iframe') return isAllowedIframeSource(rawUrl)

  const embed = classifyChatMediaUrl(rawUrl)
  if (!embed) return false

  return (
    (tag === 'img' && embed.kind === 'image') ||
    (tag === 'video' && embed.kind === 'video') ||
    (tag === 'audio' && embed.kind === 'audio')
  )
}

function parseHttpUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function isAllowedIframeSource(rawUrl: string): boolean {
  const url = parseHttpUrl(rawUrl)
  if (!url) return false

  const host = url.hostname.toLowerCase()
  if (host === 'www.youtube-nocookie.com') return url.pathname.startsWith('/embed/')
  if (host === 'player.bilibili.com') return url.pathname === '/player.html'
  if (host === 'platform.twitter.com') return url.pathname === '/embed/Tweet.html'
  if (host === 'music.163.com') return url.pathname === '/outchain/player'

  return false
}

function classifyPlatformUrl(url: URL): ChatMediaEmbed | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, '')

  const youtube = getYoutubeEmbed(url, host)
  if (youtube) return youtube

  const bilibili = getBilibiliEmbed(url, host)
  if (bilibili) return bilibili

  const x = getXEmbed(url, host)
  if (x) return x

  const netease = getNeteaseMusicEmbed(url, host)
  if (netease) return netease

  return null
}

function getYoutubeEmbed(url: URL, host: string): ChatMediaEmbed | null {
  let videoId = ''

  if (host === 'youtu.be') {
    videoId = firstPathPart(url)
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v') ?? ''
    } else if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) {
      videoId = firstPathPart(url, 1)
    }
  }

  if (!isSafeVideoId(videoId)) return null

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`)
  const start = parseYoutubeStart(url.searchParams.get('t') ?? url.searchParams.get('start'))
  if (start > 0) embedUrl.searchParams.set('start', String(start))

  return {
    kind: 'iframe',
    url: embedUrl.href,
    title: 'YouTube 视频',
    provider: 'youtube',
  }
}

function getBilibiliEmbed(url: URL, host: string): ChatMediaEmbed | null {
  if (host !== 'bilibili.com' && host !== 'm.bilibili.com' && host !== 'b23.tv') return null

  const bvid = url.pathname.match(/\/video\/(BV[0-9A-Za-z]+)/i)?.[1]
  const aid = url.pathname.match(/\/video\/av(\d+)/i)?.[1]
  if (!bvid && !aid) return null

  const embedUrl = new URL('https://player.bilibili.com/player.html')
  if (bvid) embedUrl.searchParams.set('bvid', bvid)
  if (aid) embedUrl.searchParams.set('aid', aid)
  const page = url.searchParams.get('p')
  if (page) embedUrl.searchParams.set('page', page)

  return {
    kind: 'iframe',
    url: embedUrl.href,
    title: 'Bilibili 视频',
    provider: 'bilibili',
  }
}

function getXEmbed(url: URL, host: string): ChatMediaEmbed | null {
  if (host !== 'x.com' && host !== 'twitter.com' && host !== 'mobile.twitter.com') return null

  const tweetId = url.pathname.match(/\/status(?:es)?\/(\d+)/)?.[1]
  if (!tweetId) return null

  const embedUrl = new URL('https://platform.twitter.com/embed/Tweet.html')
  embedUrl.searchParams.set('id', tweetId)

  return {
    kind: 'iframe',
    url: embedUrl.href,
    title: 'X 帖子',
    provider: 'x',
  }
}

function getNeteaseMusicEmbed(url: URL, host: string): ChatMediaEmbed | null {
  if (host !== 'music.163.com') return null

  const songId = url.searchParams.get('id') ?? url.hash.match(/[?&]id=(\d+)/)?.[1]
  if (!songId) return null

  const embedUrl = new URL('https://music.163.com/outchain/player')
  embedUrl.searchParams.set('type', '2')
  embedUrl.searchParams.set('id', songId)
  embedUrl.searchParams.set('auto', '0')
  embedUrl.searchParams.set('height', '66')

  return {
    kind: 'iframe',
    url: embedUrl.href,
    title: '网易云音乐',
    provider: 'netease',
  }
}

function getPathExtension(pathname: string): string {
  const match = pathname.toLowerCase().match(/\.[a-z0-9]+$/)
  return match?.[0] ?? ''
}

function firstPathPart(url: URL, index = 0): string {
  return url.pathname.split('/').filter(Boolean)[index] ?? ''
}

function isSafeVideoId(value: string): boolean {
  return /^[0-9A-Za-z_-]{6,}$/.test(value)
}

function parseYoutubeStart(value: string | null): number {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Number(value)

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match) return 0
  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)
  return hours * 3600 + minutes * 60 + seconds
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
