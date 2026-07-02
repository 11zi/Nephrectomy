<!-- src/views/Content/ChatRoomList.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowLeft, ChevronRight, Circle, EyeOff, FolderOpen, Info, Users, X } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { useContentStore } from '../../stores/useContentStore'
import { useChatStore } from '../../stores/useChatStore'
import { useRoomStore } from '../../stores/useRoomStore'
import type { RoomNode } from '../../types/chatTypes'

const contentStore = useContentStore()
const chatStore = useChatStore()
const roomStore = useRoomStore()
const props = withDefaults(defineProps<{
  implicitTeleport?: boolean
}>(), {
  implicitTeleport: false,
})

// 进入子房间或弹出 dialog
function handleRoomClick(room: RoomNode) {
  if (room.children.length > 0) {
    roomStore.navStack.push(room)
  } else {
    openDialog(room)
  }
}

function goBack() {
  roomStore.navStack.pop()
}

function goToLevel(index: number) {
  roomStore.navStack = roomStore.navStack.slice(0, index + 1)
}

// ── Dialog ────────────────────────────────────────────────
const dialogRoom = ref<RoomNode | null>(null)

function openDialog(room: RoomNode) {
  dialogRoom.value = room
}

function closeDialog() {
  dialogRoom.value = null
}

function openRoomInfo(room: RoomNode) {
  closeDialog()
  contentStore.navigateToRoomInfo(room.id)
}

async function enterRoom(room: RoomNode) {
  closeDialog()
  await roomStore.enterRoom(room.id, { implicit: props.implicitTeleport })
  await chatStore.fetchInitialRoomMessages(room.id)
  contentStore.navigateTo('chat')
}

// 动画：切换层级时触发
const transitioning = ref(false)
watch(
  () => roomStore.navStack,
  () => {
    transitioning.value = true
    setTimeout(() => {
      transitioning.value = false
    }, 260)
  },
  { deep: true },
)
</script>

<template>
  <div class="app-page room-list-root" :class="{ 'implicit-room-list': props.implicitTeleport }">

    <!-- 顶部导航栏 -->
    <div class="app-page-header" :class="{ 'app-page-header-bordered': props.implicitTeleport }">
      <button
        class="room-nav-button"
        @click="contentStore.navigateTo('chat')"
        title="返回聊天室"
        type="button"
      >
        <X />
      </button>

      <button
        v-if="roomStore.navStack.length > 0"
        class="room-nav-button"
        @click="goBack"
        title="返回上级"
        type="button"
      >
        <ArrowLeft />
      </button>

      <!-- 面包屑 -->
      <div class="app-page-breadcrumb">
        <span class="app-page-breadcrumb-item" @click="roomStore.navStack = []">
          {{ props.implicitTeleport ? '隐式传送' : '房间列表' }}
        </span>
        <template v-for="(room, i) in roomStore.navStack" :key="room.id">
          <ChevronRight class="app-page-breadcrumb-sep" />
          <span
            class="app-page-breadcrumb-item"
            :class="{ 'app-page-breadcrumb-current': i === roomStore.navStack.length - 1 }"
            @click="goToLevel(i)"
          >{{ room.name }}</span>
        </template>
      </div>
    </div>

    <!-- 网格区域 -->
    <div class="room-grid-wrap" :class="{ transitioning: transitioning }">
      <div class="room-grid">
        <div
          v-for="room in roomStore.currentRooms"
          :key="room.id"
          class="room-cell"
          :style="{
            '--col-span': room.colSpan,
            '--row-span': room.rowSpan,
            '--cover': room.cover,
          }"
          @click="handleRoomClick(room)"
        >
          <!-- 活跃指示点 -->
          <span v-if="room.isActive" class="active-dot"></span>

          <span v-if="room.isHidden || room.ownerOnly" class="hidden-badge">
            <EyeOff />
            已隐藏
          </span>

          <!-- 子房间角标 -->
          <span v-if="room.children.length > 0" class="child-badge">
            <FolderOpen />
            {{ room.children.length }}
          </span>

          <div class="room-cell-body">
            <div class="room-cell-name">{{ room.name }}</div>
            <div class="room-cell-desc">{{ room.description }}</div>
            <div class="room-cell-meta">
              <Users />
              {{ room.memberCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogRoom" class="room-dialog-backdrop" @click.self="closeDialog">
        <div class="room-dialog">
          <div class="room-dialog-header">
            <h2>{{ dialogRoom.name }}</h2>
            <button class="room-dialog-close" type="button" title="关闭" @click="closeDialog">
              <X />
            </button>
          </div>
          <p class="room-dialog-desc">{{ dialogRoom.description || '这个房间还没有简介' }}</p>
          <div class="room-dialog-meta">
            <span>
              <Users />
              {{ dialogRoom.memberCount }} 名成员
            </span>
            <span :class="{ active: dialogRoom.isActive }">
              <Circle />
              {{ dialogRoom.isHidden || dialogRoom.ownerOnly ? '仅房主可进入' : dialogRoom.isActive ? '有人在线' : '暂无人在线' }}
            </span>
          </div>
          <div class="room-dialog-actions">
            <Button variant="outline" @click="openRoomInfo(dialogRoom)">
              <Info />
              房间信息
            </Button>
            <Button @click="enterRoom(dialogRoom)">
              {{ props.implicitTeleport ? '传送' : '进入房间' }}
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.room-list-root {
  background: var(--app-bg-soft);
}

.room-list-root.implicit-room-list {
  background: var(--app-bg-raised);
}

.room-nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 6px;
  color: var(--app-text-soft);
  background: transparent;
  cursor: pointer;
}

.room-nav-button:hover {
  background: rgba(84, 110, 122, 0.1);
}

.room-nav-button svg,
.app-page-breadcrumb-sep,
.room-cell-meta svg,
.child-badge svg,
.hidden-badge svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ── 网格 ── */
.room-grid-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  transition: opacity 0.25s ease;
}
.room-grid-wrap.transitioning { opacity: 0; }

.room-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 120px;
  gap: 12px;
}

/* ── 房间卡片：动态列/行/背景色 ── */
.room-cell {
  grid-column: span var(--col-span, 1);
  grid-row: span var(--row-span, 1);
  background: var(--cover, #546e7a);
  border-radius: 8px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.room-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.room-cell:active { transform: scale(0.98); }

.room-cell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 60%);
  border-radius: 8px;
}

.room-cell-body {
  position: relative;
  padding: 10px 12px;
  color: #fff;
}

.room-cell-name {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.room-cell-desc {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-cell-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.75;
  margin-top: 4px;
}

/* ── 装饰元素 ── */
.active-dot {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76,175,80,0.35);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(76,175,80,0.35); }
  50%     { box-shadow: 0 0 0 5px rgba(76,175,80,0.1); }
}

.child-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.35);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
  backdrop-filter: blur(4px);
}

.hidden-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 3px;
  border-radius: 10px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.35);
  color: #fff;
  font-size: 11px;
  backdrop-filter: blur(4px);
}

.hidden-badge + .child-badge {
  top: 32px;
}

.child-badge svg {
  width: 13px;
  height: 13px;
}

.room-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(18, 28, 34, 0.42);
}

.room-dialog {
  width: min(420px, 100%);
  border: 1px solid rgba(84, 110, 122, 0.22);
  border-radius: 8px;
  padding: 18px;
  background: var(--app-surface);
  color: var(--app-text);
  box-shadow: var(--app-shadow-floating);
}

.room-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.room-dialog-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.room-dialog-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 6px;
  color: var(--app-text-muted);
  background: transparent;
  cursor: pointer;
}

.room-dialog-close:hover {
  background: rgba(84, 110, 122, 0.1);
}

.room-dialog-close svg {
  width: 18px;
  height: 18px;
}

.room-dialog-desc {
  margin: 10px 0 0;
  color: var(--app-text-muted);
  line-height: 1.5;
}

.room-dialog-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.room-dialog-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.room-dialog-meta svg {
  width: 15px;
  height: 15px;
}

.room-dialog-meta .active {
  color: #2e7d32;
}

.room-dialog-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

@media (max-width: 600px) {
  .room-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 100px;
    gap: 8px;
  }
  .room-grid-wrap { padding: 10px; }
}

@media (max-width: 360px) {
  .room-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: 96px;
  }

  .room-cell {
    grid-column: span 1 !important;
  }
}
</style>
