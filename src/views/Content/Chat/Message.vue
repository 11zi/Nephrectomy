<script setup lang="ts">
import { computed, ref } from 'vue'
import { AtSign, Copy, ExternalLink, RotateCcw, Undo2, X } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import QuoteThread from './QuoteThread.vue'
import '../../../assets/js/marked.min.js'
import { renderSafeChatMessageHtml } from '../../../utils/chatMessageHtml'
import type { ChatMessage } from '../../../types/chatTypes'
import type { QuoteThreadNode } from '../../../utils/chatQuoteThread'

type MessageAction = '引用' | '@他' | '复读' | '撤回'

const props = defineProps<{
  message: ChatMessage
  timestamp?: string
  quotedMessage?: ChatMessage | null
  quoteThread?: QuoteThreadNode | null
}>()

const emit = defineEmits<{
  action: [action: MessageAction, message: ChatMessage]
  avatarClick: [message: ChatMessage]
}>()

const actionMenuOpen = ref(false)
const pendingWebLink = ref('')

const safeHtml = computed(() => renderSafeChatMessageHtml(props.message.content))

const quotedPreview = computed(() => {
  if (!props.quotedMessage) return ''
  return renderSafeChatMessageHtml(props.quotedMessage.content)
})

const quoteThreadNodes = computed(() => props.quoteThread ? [props.quoteThread] : [])

const senderInitials = computed(() => props.message.sender.nickname.slice(0, 2).toUpperCase())

function onMessageContentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return

  const anchor = target.closest('a[href]')
  if (!(anchor instanceof HTMLAnchorElement)) return

  const url = parseWebLink(anchor.getAttribute('href') ?? '')
  if (!url) return

  event.preventDefault()
  event.stopPropagation()
  pendingWebLink.value = url.href
}

function parseWebLink(href: string): URL | null {
  try {
    const url = new URL(href, window.location.href)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function openPendingWebLink() {
  if (!pendingWebLink.value) return
  const opened = window.open(pendingWebLink.value, '_blank', 'noopener,noreferrer')
  if (opened) opened.opener = null
  pendingWebLink.value = ''
}

// ---- 右键菜单 ----
const menuItems = [
  { icon: Undo2, label: '引用' as const },
  { icon: AtSign, label: '@他' as const },
  { icon: Copy, label: '复读' as const },
  { icon: RotateCcw, label: '撤回' as const },
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  actionMenuOpen.value = true
}

function handleAction(label: MessageAction) {
  const item = menuItems.find(menuItem => menuItem.label === label)
  if (!item) return
  actionMenuOpen.value = false
  emit('action', item.label, props.message)
}
</script>

<template>
  <div class="msg-row anim_in" @contextmenu="onContextMenu">
    <Avatar class="msg-avatar" @click="emit('avatarClick', props.message)">
      <AvatarImage :src="props.message.sender.avatarUrl" :alt="props.message.sender.nickname" />
      <AvatarFallback>{{ senderInitials }}</AvatarFallback>
    </Avatar>

    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-sender">{{ props.message.sender.nickname }}</span>
        <span v-if="props.message.sender.identityId" class="msg-identity-id">
          {{ props.message.sender.identityId }}
        </span>
        <span v-if="props.timestamp" class="msg-time">{{ props.timestamp }}</span>
      </div>
      <div v-if="props.quoteThread" class="msg-quote msg-quote-thread">
        <QuoteThread :nodes="quoteThreadNodes" @content-click="onMessageContentClick" />
      </div>
      <div v-else-if="props.quotedMessage" class="msg-quote" @click="onMessageContentClick">
        <div class="msg-quote-sender">{{ props.quotedMessage.sender.nickname }}</div>
        <div class="msg-quote-content msg-rich-text" v-html="quotedPreview"></div>
      </div>
      <div class="msg-bubble msg-rich-text" @click="onMessageContentClick" v-html="safeHtml"></div>
    </div>

    <Teleport to="body">
      <div v-if="actionMenuOpen" class="msg-dialog-backdrop" @click.self="actionMenuOpen = false">
        <div class="msg-action-dialog" role="menu" aria-label="消息操作">
          <button
            v-for="item in menuItems"
            :key="item.label"
            class="msg-action-item"
            type="button"
            @click="handleAction(item.label)"
          >
            <component :is="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="pendingWebLink" class="msg-dialog-backdrop" @click.self="pendingWebLink = ''">
        <div class="link-confirm-dialog" role="dialog" aria-modal="true" aria-label="确认访问链接">
          <div class="link-confirm-header">
            <h2>确认访问链接</h2>
            <Button type="button" variant="ghost" size="icon" title="关闭" @click="pendingWebLink = ''">
              <X />
            </Button>
          </div>
          <div class="link-confirm-content">
            <div class="link-confirm-hint">即将在新标签页打开以下网页链接：</div>
            <div class="link-confirm-url">{{ pendingWebLink }}</div>
          </div>
          <div class="link-confirm-actions">
            <Button type="button" variant="outline" @click="pendingWebLink = ''">取消</Button>
            <Button type="button" @click="openPendingWebLink">
              <ExternalLink />
              访问
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
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
  width: 40px;
  height: 40px;
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

.msg-identity-id {
  color: #78909c;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.msg-time {
  font-size: 11px;
  color: #455a64;
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

.msg-rich-text :where(p) {
  margin: 0 0 8px;
}

.msg-rich-text :where(p:last-child) {
  margin-bottom: 0;
}

.msg-rich-text :where(a) {
  color: #1565c0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.msg-rich-text :where(pre) {
  margin: 8px 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(38, 50, 56, 0.08);
}

.msg-rich-text :where(code) {
  border-radius: 4px;
  padding: 1px 4px;
  background: rgba(38, 50, 56, 0.08);
}

.msg-rich-text :where(blockquote) {
  margin: 8px 0;
  padding-left: 10px;
  border-left: 3px solid rgba(84, 110, 122, 0.42);
  color: #546e7a;
}

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
  border-left: 2px solid rgba(84, 110, 122, 0.28);
  border-radius: 0 6px 6px 0;
  background: rgba(236, 239, 241, 0.36);
  color: #607d8b;
}

.msg-quote-thread {
  width: min(520px, calc(100vw - 96px));
  max-width: calc(100vw - 96px);
  overflow-x: auto;
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

.msg-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.28);
}

.msg-action-dialog {
  width: min(400px, calc(100vw - 32px));
  overflow: hidden;
  border: 1px solid rgba(84, 110, 122, 0.18);
  border-radius: 8px;
  background: #fff;
  color: #263238;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.msg-action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 46px;
  border: none;
  padding: 0 16px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.msg-action-item:hover {
  background: rgba(84, 110, 122, 0.1);
  color: #37474f;
}

.link-confirm-dialog {
  width: min(480px, calc(100vw - 32px));
  border: 1px solid rgba(84, 110, 122, 0.18);
  border-radius: 8px;
  padding: 18px;
  background: #fff;
  color: #263238;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.link-confirm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.link-confirm-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
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

.link-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
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

  .msg-quote-thread {
    width: min(100%, calc(100vw - 58px));
    max-width: calc(100vw - 58px);
    padding: 5px 7px;
  }

  .msg-bubble .chat-media {
    max-width: 100%;
  }

  .msg-action-dialog {
    width: min(360px, calc(100vw - 32px));
  }
}
</style>
