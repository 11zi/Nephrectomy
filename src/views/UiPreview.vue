<script setup lang="ts">
import { ref } from 'vue'
import { Send, Sparkles } from 'lucide-vue-next'
import MessageBubbleNew from '@/components/chat/MessageBubbleNew.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ChatMessage, UserSummary } from '@/types/chatTypes'

const nickname = ref('Codex')
const message = ref('先在隔离页里确认 shadcn-vue 和 MDUI 可以共存。')

const currentUser: UserSummary = {
  id: 'user-me',
  nickname: '我',
  avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=me',
}

const demoUsers: UserSummary[] = [
  currentUser,
  {
    id: 'user-codex',
    nickname: 'Codex',
    avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=codex',
  },
  {
    id: 'user-ds',
    nickname: 'DS',
    avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=ds',
  },
]

function createMessage(
  id: string,
  sender: UserSummary,
  content: string,
  kind: ChatMessage['kind'] = 'user',
  replyToId?: string,
): ChatMessage {
  return {
    id,
    roomId: 'ui-preview-room',
    kind,
    sender,
    content,
    createdAt: new Date().toISOString(),
    replyToId,
    mentionedUserIds: [],
    canRecall: sender.id === currentUser.id,
  }
}

const mockMessages = [
  createMessage('msg-state', demoUsers[1], 'Codex 加入了 UI 预览房间', 'state'),
  createMessage('msg-other', demoUsers[1], '这个阶段只做视觉壳，不碰真实 ChatRoom。'),
  createMessage('msg-own', demoUsers[0], '收到。先看气泡、头像、引用和操作按钮是否顺眼。'),
  createMessage(
    'msg-image',
    demoUsers[2],
    '图片消息 mock https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=960&q=80',
  ),
  createMessage('msg-video', demoUsers[1], '视频链接 mock https://youtu.be/dQw4w9WgXcQ'),
  createMessage('msg-quote', demoUsers[0], '引用消息 mock：后续灰度接入时保持旧组件可回退。', 'user', 'msg-other'),
]

const messagesById = new Map(mockMessages.map(item => [item.id, item]))
</script>

<template>
  <main class="ui-preview-root min-h-screen overflow-auto bg-background px-5 py-8 text-foreground">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header class="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm text-muted-foreground">Nephrectomy UI Preview</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-normal">shadcn-vue 基础组件验证</h1>
        </div>
        <div class="flex flex-wrap gap-2">
          <Badge>Tailwind v4</Badge>
          <Badge variant="secondary">MDUI 保留</Badge>
          <Badge variant="outline">隔离预览</Badge>
        </div>
      </header>

      <section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>聊天输入外观</CardTitle>
            <CardDescription>只验证基础组件样式，不接入真实 store、socket 或发送逻辑。</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-2 text-sm font-medium">
                昵称
                <Input v-model="nickname" placeholder="输入昵称" />
              </label>
              <label class="grid gap-2 text-sm font-medium">
                状态
                <Input model-value="在线验证中" disabled />
              </label>
            </div>
            <label class="grid gap-2 text-sm font-medium">
              消息
              <Textarea v-model="message" rows="4" />
            </label>
          </CardContent>
          <CardFooter class="justify-between gap-3">
            <Button variant="outline">
              <Sparkles />
              预览
            </Button>
            <Button>
              <Send />
              发送样式
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>消息卡片 mock</CardTitle>
            <CardDescription>已拆成独立 MessageBubbleNew，但仍只在预览页展示。</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <MessageBubbleNew
              :message="createMessage('msg-live', demoUsers[1], message)"
              :current-user-id="currentUser.id"
              timestamp="刚刚"
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>MessageBubbleNew</CardTitle>
            <CardDescription>覆盖自己消息、他人消息、系统消息、图片、视频链接和引用场景。</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1">
            <MessageBubbleNew
              v-for="item in mockMessages"
              :key="item.id"
              :message="item"
              :quoted-message="item.replyToId ? messagesById.get(item.replyToId) : null"
              :current-user-id="currentUser.id"
              timestamp="22:30"
            />
          </CardContent>
        </Card>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Button</CardTitle>
            <CardDescription>第一批迁移对象。</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-wrap gap-2">
            <Button size="sm">Default</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badge</CardTitle>
            <CardDescription>适合状态、标签、房间属性。</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-wrap gap-2">
            <Badge>默认</Badge>
            <Badge variant="secondary">次要</Badge>
            <Badge variant="outline">边框</Badge>
            <Badge variant="destructive">危险</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>头像组件风险较低。</CardDescription>
          </CardHeader>
          <CardContent class="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/9.x/thumbs/svg?seed=Neph" alt="Neph avatar" />
              <AvatarFallback>NP</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>YA</AvatarFallback>
            </Avatar>
          </CardContent>
        </Card>
      </section>
    </div>
  </main>
</template>
