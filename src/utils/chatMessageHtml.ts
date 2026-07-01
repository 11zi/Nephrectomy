import DOMPurify from 'dompurify'
import { renderPresetChatEmojis } from './chatEmoji'
import { isAllowedChatMediaElement, renderMessageMediaLinks } from './chatMedia'

export function renderSafeChatMessageHtml(content: string): string {
  const parsed = marked.parse(renderPresetChatEmojis(renderMessageMediaLinks(content)))
  const sanitized = DOMPurify.sanitize(parsed, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'code', 'pre',
      'blockquote', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'hr', 'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'video', 'audio', 'iframe',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target',
      'src', 'alt', 'class', 'controls', 'preload', 'playsinline',
      'loading', 'referrerpolicy', 'allow', 'allowfullscreen',
      'data-chat-media',
    ],
    FORCE_BODY: true,
  })
  return stripUntrustedMedia(sanitized)
}

function stripUntrustedMedia(html: string): string {
  const template = document.createElement('template')
  template.innerHTML = html

  template.content.querySelectorAll('img, video, audio, iframe').forEach((element) => {
    const src = element.getAttribute('src') ?? ''
    const isGeneratedMedia = element.getAttribute('data-chat-media') === 'true'
    const isAllowedSource = isAllowedChatMediaElement(element.tagName, src)

    if (!isGeneratedMedia || !isAllowedSource) {
      element.replaceWith(document.createTextNode(src))
      return
    }

    element.removeAttribute('data-chat-media')
  })

  return template.innerHTML
}
