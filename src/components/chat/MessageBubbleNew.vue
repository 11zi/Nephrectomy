<script setup lang="ts">
import { computed } from 'vue'
import { ImageIcon, Link2, MessageSquareQuote, RotateCcw, UserRoundPlus } from 'lucide-vue-next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { classifyChatMediaUrl } from '@/utils/chatMedia'
import QuoteThread from '@/views/Content/Chat/QuoteThread.vue'
import type { ChatMessage } from '@/types/chatTypes'
import type { QuoteThreadNode } from '@/utils/chatQuoteThread'

type MessageAction = '引用' | '@他' | '复读' | '撤回'

const props = defineProps<{
  message: ChatMessage
  timestamp?: string
  quotedMessage?: ChatMessage | null
  quoteThread?: QuoteThreadNode | null
  currentUserId?: string | null
}>()

const emit = defineEmits<{
  action: [action: MessageAction, message: ChatMessage]
  avatarClick: [message: ChatMessage]
}>()

const isOwnMessage = computed(() => props.currentUserId === props.message.sender.id)
const isStateMessage = computed(() => props.message.kind === 'state')
const isCommandMessage = computed(() => props.message.kind === 'command')

const firstUrl = computed(() => {
  return props.message.content.match(/https?:\/\/[^\s<>\]]+/i)?.[0] ?? ''
})

const mediaEmbed = computed(() => {
  return firstUrl.value ? classifyChatMediaUrl(firstUrl.value) : null
})

const plainContent = computed(() => {
  return props.message.content.replace(firstUrl.value, '').trim() || props.message.content
})

const senderInitials = computed(() => {
  return props.message.sender.nickname.slice(0, 2).toUpperCase()
})

const quotedPreview = computed(() => {
  if (!props.quotedMessage) return ''
  return props.quotedMessage.content.length > 72
    ? `${props.quotedMessage.content.slice(0, 72)}...`
    : props.quotedMessage.content
})

const quoteThreadNodes = computed(() => props.quoteThread ? [props.quoteThread] : [])

const rowClass = computed(() =>
  cn('flex w-full gap-3 py-2', {
    'justify-end': isOwnMessage.value,
    'justify-center': isStateMessage.value,
  }),
)

const bubbleClass = computed(() =>
  cn(
    'max-w-[min(36rem,100%)] rounded-lg border px-3 py-2 text-sm leading-6 shadow-sm',
    isOwnMessage.value
      ? 'rounded-br-sm border-primary/15 bg-primary text-primary-foreground'
      : 'rounded-bl-sm bg-card text-card-foreground',
    isCommandMessage.value && 'border-dashed border-amber-300 bg-amber-50 text-amber-950',
  ),
)
</script>

<template>
  <div v-if="isStateMessage" :class="rowClass">
    <div class="inline-flex max-w-[80%] items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
      <Badge variant="secondary">系统</Badge>
      <span class="truncate">{{ message.content }}</span>
      <span v-if="timestamp" class="shrink-0">{{ timestamp }}</span>
    </div>
  </div>

  <div v-else :class="rowClass">
    <Avatar v-if="!isOwnMessage" class="mt-1 size-9 cursor-pointer" @click="emit('avatarClick', message)">
      <AvatarImage :src="message.sender.avatarUrl" :alt="message.sender.nickname" />
      <AvatarFallback>{{ senderInitials }}</AvatarFallback>
    </Avatar>

    <div :class="cn('flex min-w-0 max-w-[78%] flex-col gap-1', isOwnMessage ? 'items-end' : 'items-start')">
      <div :class="cn('flex items-center gap-2 text-xs text-muted-foreground', isOwnMessage && 'flex-row-reverse')">
        <span class="font-medium text-foreground">{{ message.sender.nickname }}</span>
        <span v-if="timestamp">{{ timestamp }}</span>
        <Badge v-if="isCommandMessage" variant="outline">指令</Badge>
      </div>

      <div v-if="quoteThread" class="w-[min(32rem,calc(100vw-6rem))] max-w-full overflow-x-auto rounded-md border-l-2 border-muted-foreground/25 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <QuoteThread :nodes="quoteThreadNodes" />
      </div>
      <div v-else-if="quotedMessage" class="max-w-full rounded-md border-l-2 border-muted-foreground/25 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <div class="mb-1 flex items-center gap-1 font-medium">
          <MessageSquareQuote class="size-3.5" />
          {{ quotedMessage.sender.nickname }}
        </div>
        <div class="line-clamp-2 break-words">{{ quotedPreview }}</div>
      </div>

      <div :class="bubbleClass">
        <p v-if="plainContent" class="whitespace-pre-wrap break-words">{{ plainContent }}</p>

        <div v-if="mediaEmbed" class="mt-2 overflow-hidden rounded-md border bg-background/80">
          <img
            v-if="mediaEmbed.kind === 'image'"
            :src="mediaEmbed.url"
            :alt="mediaEmbed.title"
            class="max-h-72 w-full object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <div v-else class="flex items-center gap-3 p-3 text-sm">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Link2 v-if="mediaEmbed.kind === 'iframe'" class="size-5" />
              <ImageIcon v-else class="size-5" />
            </div>
            <div class="min-w-0">
              <div class="font-medium">{{ mediaEmbed.title }}</div>
              <div class="truncate text-xs opacity-75">{{ mediaEmbed.url }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-1 opacity-70 transition-opacity hover:opacity-100">
        <Button size="sm" variant="ghost" class="h-7 px-2" @click="emit('action', '引用', message)">
          <MessageSquareQuote />
          引用
        </Button>
        <Button size="sm" variant="ghost" class="h-7 px-2" @click="emit('action', '@他', message)">
          <UserRoundPlus />
          @他
        </Button>
        <Button size="sm" variant="ghost" class="h-7 px-2" @click="emit('action', '复读', message)">
          <RotateCcw />
          复读
        </Button>
      </div>
    </div>

    <Avatar v-if="isOwnMessage" class="mt-1 size-9 cursor-pointer" @click="emit('avatarClick', message)">
      <AvatarImage :src="message.sender.avatarUrl" :alt="message.sender.nickname" />
      <AvatarFallback>{{ senderInitials }}</AvatarFallback>
    </Avatar>
  </div>
</template>
