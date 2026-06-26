<!-- src/views/Content/ChatRoomList.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useContentStore } from '../../stores/useContentStore'
import { useRoomStore } from '../../stores/useRoomStore'
import type { RoomNode } from '../../types/chatTypes'

const contentStore = useContentStore()
const roomStore = useRoomStore()

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
  mdui.dialog({
    title: room.name,
    content: `
      <div style="padding: 8px 0">
        <p style="color:#546e7a; margin:0 0 12px">${room.description}</p>
        <p style="margin:0; font-size:13px; color:#90a4ae">
          <i class="mdui-icon material-icons" style="font-size:16px;vertical-align:-3px">people</i>
          ${room.memberCount} 名成员
          &nbsp;&nbsp;
          <span style="color:${room.isActive ? '#4caf50' : '#b0bec5'}">
            <i class="mdui-icon material-icons" style="font-size:16px;vertical-align:-3px">fiber_manual_record</i>
            ${room.isActive ? '有人在线' : '暂无人在线'}
          </span>
        </p>
      </div>
    `,
    buttons: [
      {
        text: '房间信息',
        bold: false,
        close: true,
        onClick: () => {
          console.log('查看房间信息:', room.id)
        },
      },
      {
        text: '进入房间',
        bold: true,
        close: true,
        onClick: async () => {
          await roomStore.enterRoom(room.id)
          contentStore.navigateTo('chat')
        },
      },
    ],
  })
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
  <div class="room-list-root">

    <!-- 顶部导航栏：用 mdui 已有类 + 少量 inline -->
    <div class="room-list-header">
      <button
        v-if="roomStore.navStack.length > 0"
        class="mdui-btn mdui-btn-icon mdui-ripple"
        @click="goBack"
        title="返回上级"
      >
        <i class="mdui-icon material-icons">arrow_back</i>
      </button>

      <!-- 面包屑 -->
      <div class="breadcrumb">
        <span class="breadcrumb-item" @click="roomStore.navStack = []">房间列表</span>
        <template v-for="(room, i) in roomStore.navStack" :key="room.id">
          <i class="mdui-icon material-icons breadcrumb-sep">chevron_right</i>
          <span
            class="breadcrumb-item"
            :class="{ 'breadcrumb-current': i === roomStore.navStack.length - 1 }"
            @click="goToLevel(i)"
          >{{ room.name }}</span>
        </template>
      </div>

      <button
        class="mdui-btn mdui-btn-icon mdui-ripple"
        @click="contentStore.navigateTo('chat')"
        title="返回聊天室"
        style="margin-left: auto; flex-shrink: 0;"
      >
        <i class="mdui-icon material-icons">close</i>
      </button>
    </div>

    <!-- 网格区域 -->
    <div class="room-grid-wrap" :class="{ transitioning: transitioning }">
      <div class="room-grid">
        <div
          v-for="room in roomStore.currentRooms"
          :key="room.id"
          class="room-cell mdui-ripple"
          :style="{
            '--col-span': room.colSpan,
            '--row-span': room.rowSpan,
            '--cover': room.cover,
          }"
          @click="handleRoomClick(room)"
        >
          <!-- 活跃指示点 -->
          <span v-if="room.isActive" class="active-dot"></span>

          <!-- 子房间角标 -->
          <span v-if="room.children.length > 0" class="child-badge">
            <i class="mdui-icon material-icons">folder_open</i>
            {{ room.children.length }}
          </span>

          <div class="room-cell-body">
            <div class="room-cell-name">{{ room.name }}</div>
            <div class="room-cell-desc">{{ room.description }}</div>
            <div class="room-cell-meta">
              <i class="mdui-icon material-icons" style="font-size:14px;vertical-align:-2px;">people</i>
              {{ room.memberCount }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-list-root {
  height: 100%;
  width: -webkit-fill-available;
  display: flex;
  flex-direction: column;
  background: #eceff1;
  overflow: hidden;
}

/* ── 顶部导航：透明占位背景，仅显示文字 ── */
.room-list-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid transparent;
  flex-shrink: 0;
  min-height: 52px;
}

/* ── 面包屑 ── */
.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  font-size: 14px;
  overflow: hidden;
}

.breadcrumb-item {
  color: #78909c;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
  transition: color 0.15s, background 0.15s;
}
.breadcrumb-item:hover {
  color: #37474f;
  background: #eceff1;
}
.breadcrumb-current {
  color: #37474f;
  font-weight: 500;
  cursor: default;
}
.breadcrumb-current:hover { background: none; }

.breadcrumb-sep {
  font-size: 16px;
  color: #b0bec5;
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

/* ── 房间卡片：动态列/行/背景色，无法用 mdui-row/mdui-col 替代 ── */
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
.child-badge .mdui-icon { font-size: 13px; }

@media (max-width: 600px) {
  .room-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 100px;
    gap: 8px;
  }
  .room-grid-wrap { padding: 10px; }
}
</style>
