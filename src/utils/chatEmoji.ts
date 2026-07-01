export const PRESET_CHAT_EMOJIS = [
  'sentiment_very_satisfied',
  'sentiment_satisfied',
  'sentiment_neutral',
  'sentiment_dissatisfied',
  'sentiment_very_dissatisfied',
  'mood',
  'mood_bad',
  'insert_emoticon',
  'face',
  'tag_faces',
  'thumb_up',
  'thumb_down',
  'favorite',
  'star',
  'whatshot',
  'cake',
  'local_fire_department',
  'bolt',
  'water_drop',
  'eco',
] as const

export type PresetChatEmoji = (typeof PRESET_CHAT_EMOJIS)[number]

export const PRESET_CHAT_EMOJI_LABELS: Record<PresetChatEmoji, string> = {
  sentiment_very_satisfied: '😄',
  sentiment_satisfied: '🙂',
  sentiment_neutral: '😐',
  sentiment_dissatisfied: '🙁',
  sentiment_very_dissatisfied: '😣',
  mood: '😊',
  mood_bad: '😞',
  insert_emoticon: '😃',
  face: '😀',
  tag_faces: '😋',
  thumb_up: '👍',
  thumb_down: '👎',
  favorite: '❤️',
  star: '⭐',
  whatshot: '🔥',
  cake: '🎂',
  local_fire_department: '🚒',
  bolt: '⚡',
  water_drop: '💧',
  eco: '🌿',
}

const PRESET_CHAT_EMOJI_SET = new Set<string>(PRESET_CHAT_EMOJIS)
const PRESET_CHAT_EMOJI_RE = /:([a-z0-9_]+):/g
const CUSTOM_CHAT_EMOJI_STORAGE_KEY = 'nephrectomy.customChatEmojiUrls'
const CUSTOM_EMOJI_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

export function renderPresetChatEmojis(content: string): string {
  return content.replace(PRESET_CHAT_EMOJI_RE, (token, iconName: string) => {
    if (!PRESET_CHAT_EMOJI_SET.has(iconName)) return token
    const label = PRESET_CHAT_EMOJI_LABELS[iconName as PresetChatEmoji]
    return `<span class="chat-preset-emoji" title=":${iconName}:" aria-label=":${iconName}:">${label}</span>`
  })
}

export function loadCustomChatEmojiUrls(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CUSTOM_CHAT_EMOJI_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is string => isCustomChatEmojiUrl(value))
  } catch {
    return []
  }
}

export function saveCustomChatEmojiUrls(urls: string[]): void {
  const normalized = Array.from(new Set(urls.filter(isCustomChatEmojiUrl)))
  window.localStorage.setItem(CUSTOM_CHAT_EMOJI_STORAGE_KEY, JSON.stringify(normalized))
}

export function isCustomChatEmojiUrl(rawUrl: string): boolean {
  const url = parseHttpUrl(rawUrl)
  if (!url) return false
  return CUSTOM_EMOJI_IMAGE_EXTENSIONS.has(getPathExtension(url.pathname))
}

export function normalizeCustomChatEmojiUrl(rawUrl: string): string | null {
  const url = parseHttpUrl(rawUrl)
  if (!url || !isCustomChatEmojiUrl(url.href)) return null
  return url.href
}

function parseHttpUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function getPathExtension(pathname: string): string {
  const match = pathname.toLowerCase().match(/\.[a-z0-9]+$/)
  return match?.[0] ?? ''
}
