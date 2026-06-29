<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import '../../../assets/js/marked.min.js'
import { renderPresetChatEmojis } from '../../../utils/chatEmoji'
import { isAllowedChatMediaElement, renderMessageMediaLinks } from '../../../utils/chatMedia'
import type { ChatMessage } from '../../../types/chatTypes'

type MessageAction = '引用' | '@他' | '复读' | '撤回'

const props = defineProps<{
  message: ChatMessage
  timestamp?: string
  quotedMessage?: ChatMessage | null
}>()

const emit = defineEmits<{
  action: [action: MessageAction, message: ChatMessage]
  avatarClick: [message: ChatMessage]
}>()

const safeHtml = computed(() => renderSafeHtml(props.message.content))

const quotedPreview = computed(() => {
  if (!props.quotedMessage) return ''
  return renderSafeHtml(props.quotedMessage.content)
})

function renderSafeHtml(content: string): string {
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

function onMessageContentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return

  const anchor = target.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return

  const url = parseWebLink(anchor.getAttribute('href') ?? '')
  if (!url) return

  event.preventDefault()
  event.stopPropagation()
  confirmOpenWebLink(url.href)
}

function parseWebLink(href: string): URL | null {
  try {
    const url = new URL(href, window.location.href)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function confirmOpenWebLink(url: string) {
  mdui.dialog({
    title: '确认访问链接',
    content: `
      <div class="link-confirm-content">
        <div class="link-confirm-hint">即将在新标签页打开以下网页链接：</div>
        <div class="mdui-dialog-content link-confirm-url">${escapeHtml(url)}</div>
      </div>
    `,
    cssClass: 'link-confirm-dialog',
    buttons: [
      {
        text: '取消',
        close: true,
      },
      {
        text: '访问',
        bold: true,
        close: true,
        onClick: () => {
          const opened = window.open(url, '_blank', 'noopener,noreferrer')
          if (opened) opened.opener = null
        },
      },
    ],
    history: false,
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---- 右键菜单 ----
const menuItems = [
  { icon: 'reply',        label: '引用' as const },
  { icon: 'person',       label: '@他' as const },
  { icon: 'content_copy', label: '复读' as const },
  { icon: 'undo',         label: '撤回' as const },
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  mdui.dialog({
    content: menuItems.map(item =>
      `<div class="mdui-list-item mdui-ripple msg-action-item" data-action="${item.label}">
        <i class="mdui-list-item-icon mdui-icon material-icons">${item.icon}</i>
        <div class="mdui-list-item-content">${item.label}</div>
      </div>`
    ).join(''),
    cssClass: 'msg-action-dialog',
    buttons: [],
    history: false,
    onOpened: (s) => {
      s.$element[0].querySelectorAll('.msg-action-item').forEach((el) => {
        el.addEventListener('click', () => {
          handleAction(el.getAttribute('data-action'))
          s.close()
        })
      })
    },
  })
}

function handleAction(label: string | null) {
  const item = menuItems.find(menuItem => menuItem.label === label)
  if (!item) return
  emit('action', item.label, props.message)
}
</script>

<template>
  <div class="msg-row anim_in" @contextmenu="onContextMenu">
    <img
      :src="props.message.sender.avatarUrl"
      alt="avatar"
      class="mdui-img-circle msg-avatar"
      width="40"
      height="40"
      @click="emit('avatarClick', props.message)"
    />

    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-sender">{{ props.message.sender.nickname }}</span>
        <span v-if="props.timestamp" class="msg-time">{{ props.timestamp }}</span>
      </div>
      <div v-if="props.quotedMessage" class="msg-quote" @click="onMessageContentClick">
        <div class="msg-quote-sender">{{ props.quotedMessage.sender.nickname }}</div>
        <div class="msg-quote-content mdui-typo" v-html="quotedPreview"></div>
      </div>
      <div class="msg-bubble mdui-typo" @click="onMessageContentClick" v-html="safeHtml"></div>
    </div>
  </div>
</template>

<style>
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 0;
}

.msg-avatar {
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}

.msg-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  max-width: 100%;
}

.msg-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.msg-sender {
  font-size: 12px;
  font-weight: 600;
  color: #546e7a;
}

.msg-time {
  font-size: 11px;
  color: #90a4ae;
}

.msg-bubble {
  display: inline-block;
  max-width: 100%;
  background: #eceff1;
  border-radius: 0 8px 8px 8px;
  padding: 8px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  word-break: break-word;
}

.msg-bubble p:first-child { margin-top: 0; }
.msg-bubble p:last-child  { margin-bottom: 0; }

.msg-bubble a,
.msg-quote-content a {
  cursor: pointer;
}

.msg-bubble .chat-media {
  display: block;
  max-width: min(520px, 100%);
  margin: 6px 0;
  border-radius: 6px;
  background: #000;
}

.msg-quote {
  max-width: min(520px, 100%);
  padding: 6px 10px;
  border-left: 3px solid #90a4ae;
  border-radius: 0 6px 6px 0;
  background: rgba(236, 239, 241, 0.72);
  color: #607d8b;
}

.msg-quote-sender {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 2px;
}

.msg-quote-content {
  font-size: 12px;
  line-height: 1.35;
  max-height: 42px;
  overflow: hidden;
}

.msg-quote-content p:first-child { margin-top: 0; }
.msg-quote-content p:last-child { margin-bottom: 0; }

.msg-bubble .chat-media-image {
  height: auto;
  background: transparent;
}

.msg-bubble .chat-media-video,
.msg-bubble .chat-media-audio {
  width: min(520px, 100%);
}

.msg-bubble .chat-media-iframe {
  width: min(520px, 100%);
  aspect-ratio: 16 / 9;
  border: 0;
}

.msg-bubble .chat-media-audio {
  height: 36px;
  background: transparent;
}

.msg-bubble pre {
  max-width: 100%;
  overflow-x: auto;
}

.msg-bubble .chat-preset-emoji,
.msg-quote-content .chat-preset-emoji {
  display: inline-block;
  color: #546e7a;
  font-size: 22px;
  line-height: 1;
  vertical-align: -5px;
}

/* 消息操作 dialog 宽度，用双 class 提高特异性覆盖 mdui */
.mdui-dialog.msg-action-dialog {
  width: 400px;
  min-width: 220px;
}

/* dialog 内菜单项样式 */
.msg-action-item {
  cursor: pointer;
}

.mdui-dialog.link-confirm-dialog {
  max-width: min(480px, calc(100vw - 32px));
}

.link-confirm-content {
  padding: 2px 0 4px;
}

.link-confirm-hint {
  color: #546e7a;
  font-size: 14px;
  margin-bottom: 10px;
}

.link-confirm-url {
  max-height: 128px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 6px;
  background: #eceff1;
  color: #263238;
  font-size: 13px;
  line-height: 1.45;
  word-break: break-all;
}

.anim_in {
  animation-duration: 200ms;
  animation-fill-mode: both;
  animation-name: fadeInLeft;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (max-width: 600px) {
  .msg-row {
    gap: 8px;
    padding: 3px 0;
  }

  .msg-avatar {
    width: 34px;
    height: 34px;
  }

  .msg-bubble {
    padding: 7px 10px;
    font-size: 13px;
    line-height: 1.45;
  }

  .msg-quote {
    max-width: 100%;
  }

  .msg-bubble .chat-media {
    max-width: 100%;
  }

  .mdui-dialog.msg-action-dialog {
    width: min(360px, calc(100vw - 32px));
  }
}
</style>
