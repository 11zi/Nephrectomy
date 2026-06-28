import { describe, expect, it } from 'vitest'
import { classifyChatMediaUrl, isAllowedChatMediaElement, renderMessageMediaLinks } from '../chatMedia'

describe('chat media links', () => {
  it('renders bracket image links as direct img embeds', () => {
    const html = renderMessageMediaLinks('看看这个图 [https://example.com/a.png?size=large]')

    expect(html).toContain('<img')
    expect(html).toContain('src="https://example.com/a.png?size=large"')
  })

  it('renders direct audio and video links without changing their host', () => {
    expect(classifyChatMediaUrl('https://cdn.example.com/movie.mp4')?.kind).toBe('video')
    expect(classifyChatMediaUrl('https://cdn.example.com/song.flac')?.kind).toBe('audio')
  })

  it('uses platform embed URLs for YouTube instead of treating it as a file', () => {
    const embed = classifyChatMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m2s')

    expect(embed).toMatchObject({
      kind: 'iframe',
      provider: 'youtube',
    })
    expect(embed?.url).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=62')
  })

  it('supports Bilibili, X, and Netease platform embeds', () => {
    expect(classifyChatMediaUrl('https://www.bilibili.com/video/BV1xx411c7mD')?.provider).toBe('bilibili')
    expect(classifyChatMediaUrl('https://x.com/openai/status/1234567890')?.provider).toBe('x')
    expect(classifyChatMediaUrl('https://music.163.com/#/song?id=123456')?.provider).toBe('netease')
  })

  it('leaves unsupported bracket links untouched', () => {
    expect(renderMessageMediaLinks('文档 [https://example.com/readme.txt]')).toBe('文档 [https://example.com/readme.txt]')
  })

  it('only trusts expected media sources for sanitized media tags', () => {
    expect(isAllowedChatMediaElement('img', 'https://example.com/a.webp')).toBe(true)
    expect(isAllowedChatMediaElement('iframe', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true)
    expect(isAllowedChatMediaElement('iframe', 'https://example.com/embed/dQw4w9WgXcQ')).toBe(false)
  })
})
