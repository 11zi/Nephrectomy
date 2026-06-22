<!-- src/views/Content/ChatRoomList.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContentStore } from '../../stores/useContentStore'

const contentStore = useContentStore()

// ── 类型定义 ─────────────────────────────────────────────
interface Room {
  id: string
  name: string
  description: string
  cover?: string // 封面色或图片 URL
  colSpan: 1 | 2 | 3 // 横向占格
  rowSpan: 1 | 2 // 纵向占格
  memberCount: number
  isActive: boolean // 当前是否有人在线
  parentId: string | null
  children: Room[]
  canEdit?: boolean // TODO: 接入权限系统后由后端返回
}

// ── 假数据（待后端接入时替换为 API 请求）───────────────────
const rootRooms: Room[] = [
  {
    id: '1',
    name: '综合大厅',
    description: '所有人都能进入的公共空间',
    cover: '#546e7a',
    colSpan: 2,
    rowSpan: 2,
    memberCount: 42,
    isActive: true,
    parentId: null,
    canEdit: false,
    children: [
      {
        id: '1-1',
        name: '日常闲聊',
        description: '随便聊点什么',
        cover: '#607d8b',
        colSpan: 1,
        rowSpan: 1,
        memberCount: 18,
        isActive: true,
        parentId: '1',
        children: [],
        canEdit: false,
      },
      {
        id: '1-2',
        name: '资源分享',
        description: '分享好东西',
        cover: '#78909c',
        colSpan: 2,
        rowSpan: 1,
        memberCount: 7,
        isActive: false,
        parentId: '1',
        children: [],
        canEdit: false,
      },
      {
        id: '1-3',
        name: '公告板',
        description: '重要通知在这里',
        cover: '#455a64',
        colSpan: 1,
        rowSpan: 1,
        memberCount: 0,
        isActive: false,
        parentId: '1',
        children: [],
        canEdit: true,
      },
    ],
  },
  {
    id: '2',
    name: '创作工坊',
    description: '创作者聚集地',
    cover: '#4e6b5e',
    colSpan: 1,
    rowSpan: 1,
    memberCount: 15,
    isActive: true,
    parentId: null,
    canEdit: false,
    children: [
      {
        id: '2-1',
        name: '绘画区',
        description: '画师交流',
        cover: '#4caf50',
        colSpan: 1,
        rowSpan: 2,
        memberCount: 8,
        isActive: true,
        parentId: '2',
        children: [],
        canEdit: false,
      },
      {
        id: '2-2',
        name: '写作区',
        description: '文字创作',
        cover: '#388e3c',
        colSpan: 2,
        rowSpan: 1,
        memberCount: 4,
        isActive: false,
        parentId: '2',
        children: [],
        canEdit: false,
      },
      {
        id: '2-3',
        name: '音乐区',
        description: '音乐制作讨论',
        cover: '#2e7d32',
        colSpan: 2,
        rowSpan: 1,
        memberCount: 3,
        isActive: true,
        parentId: '2',
        children: [],
        canEdit: true,
      },
    ],
  },
  {
    id: '3',
    name: '游戏频道',
    description: '一起来玩游戏',
    cover: '#5c4a7a',
    colSpan: 1,
    rowSpan: 2,
    memberCount: 31,
    isActive: true,
    parentId: null,
    canEdit: false,
    children: [
      {
        id: '3-1',
        name: '开黑组队',
        description: '找队友',
        cover: '#7e57c2',
        colSpan: 2,
        rowSpan: 1,
        memberCount: 20,
        isActive: true,
        parentId: '3',
        children: [],
        canEdit: false,
      },
      {
        id: '3-2',
        name: '攻略交流',
        description: '分享技巧',
        cover: '#673ab7',
        colSpan: 1,
        rowSpan: 1,
        memberCount: 8,
        isActive: false,
        parentId: '3',
        children: [],
        canEdit: false,
      },
      {
        id: '3-3',
        name: '赛事讨论',
        description: '电竞资讯',
        cover: '#512da8',
        colSpan: 1,
        rowSpan: 1,
        memberCount: 3,
        isActive: true,
        parentId: '3',
        children: [],
        canEdit: true,
      },
    ],
  },
  {
    id: '4',
    name: '技术角落',
    description: '编程与技术讨论',
    cover: '#1a5f7a',
    colSpan: 3,
    rowSpan: 1,
    memberCount: 22,
    isActive: false,
    parentId: null,
    canEdit: false,
    children: [
      {
        id: '4-1',
        name: '前端开发',
        description: 'Web 前端',
        cover: '#0288d1',
        colSpan: 1,
        rowSpan: 1,
        memberCount: 9,
        isActive: true,
        parentId: '4',
        children: [],
        canEdit: false,
      },
      {
        id: '4-2',
        name: '后端开发',
        description: '服务端技术',
        cover: '#0277bd',
        colSpan: 1,
        rowSpan: 1,
        memberCount: 7,
        isActive: false,
        parentId: '4',
        children: [],
        canEdit: false,
      },
      {
        id: '4-3',
        name: '运维部署',
        description: 'DevOps',
        cover: '#01579b',
        colSpan: 1,
        rowSpan: 1,
        memberCount: 6,
        isActive: true,
        parentId: '4',
        children: [],
        canEdit: true,
      },
    ],
  },
]

// ── 导航状态 ──────────────────────────────────────────────
const navStack = ref<Room[]>([]) // 面包屑栈，空 = 在根目录
const currentRooms = computed<Room[]>(() =>
  navStack.value.length === 0
    ? rootRooms
    : navStack.value[navStack.value.length - 1].children,
)

// 进入子房间或弹出 dialog
function handleRoomClick(room: Room) {
  if (room.children.length > 0) {
    navStack.value.push(room)
  } else {
    openDialog(room)
  }
}

function goBack() {
  navStack.value.pop()
}

function goToLevel(index: number) {
  navStack.value = navStack.value.slice(0, index + 1)
}

// ── Dialog ────────────────────────────────────────────────
const dialogRoom = ref<Room | null>(null)

function openDialog(room: Room) {
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
      ...(room.canEdit
        ? [
            {
              text: '编辑房间',
              bold: false,
              close: true,
              onClick: () => {
                // TODO: 跳转到房间编辑页，逻辑同 account-edit
                // contentStore.navigateTo('room-edit')
                console.log('编辑房间:', room.id)
              },
            },
          ]
        : []),
      {
        text: '房间信息',
        bold: false,
        close: true,
        onClick: () => {
          // TODO: 刷新并打开侧边栏房间信息组件
          // sidebarStore.openPanel('房间信息')
          console.log('查看房间信息:', room.id)
        },
      },
      {
        text: '进入房间',
        bold: true,
        close: true,
        onClick: () => {
          contentStore.navigateTo('chat')
        },
      },
    ],
  })
}

// 动画：切换层级时触发
const transitioning = ref(false)
watch(
  navStack,
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
    <!-- 顶部导航栏 -->
    <div class="room-list-header">
      <button
        v-if="navStack.length > 0"
        class="mdui-btn mdui-btn-icon mdui-ripple back-btn"
        @click="goBack"
        title="返回上级"
      >
        <i class="mdui-icon material-icons">arrow_back</i>
      </button>

      <!-- 面包屑 -->
      <div class="breadcrumb">
        <span class="breadcrumb-item" @click="navStack = []">房间列表</span>
        <template v-for="(room, i) in navStack" :key="room.id">
          <i class="mdui-icon material-icons breadcrumb-sep">chevron_right</i>
          <span
            class="breadcrumb-item"
            :class="{ 'breadcrumb-current': i === navStack.length - 1 }"
            @click="goToLevel(i)"
            >{{ room.name }}</span
          >
        </template>
      </div>

      <button
        class="mdui-btn mdui-btn-icon mdui-ripple"
        @click="contentStore.navigateTo('chat')"
        title="返回聊天室"
        style="margin-left: auto; flex-shrink: 0"
      >
        <i class="mdui-icon material-icons">close</i>
      </button>
    </div>

    <!-- 网格区域 -->
    <div class="room-grid-wrap" :class="{ transitioning: transitioning }">
      <div class="room-grid">
        <div
          v-for="room in currentRooms"
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
              <i
                class="mdui-icon material-icons"
                style="font-size: 14px; vertical-align: -2px"
                >people</i
              >
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

/* ── 顶部导航 ── */
.room-list-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #cfd8dc;
  flex-shrink: 0;
  min-height: 52px;
}

.back-btn {
  flex-shrink: 0;
  color: #546e7a;
}

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
  transition:
    color 0.15s,
    background 0.15s;
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
.breadcrumb-current:hover {
  background: none;
}

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
.room-grid-wrap.transitioning {
  opacity: 0;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 120px;
  gap: 12px;
}

/* ── 房间卡片 ── */
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}
.room-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.room-cell:active {
  transform: scale(0.98);
}

/* 渐变遮罩，让文字更可读 */
.room-cell::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.05) 60%
  );
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
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
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

/* 活跃指示点 */
.active-dot {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.35);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.35);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(76, 175, 80, 0.1);
  }
}

/* 子房间角标 */
.child-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 3px;
  backdrop-filter: blur(4px);
}
.child-badge .mdui-icon {
  font-size: 13px;
}

/* ── 移动端适配 ── */
@media (max-width: 600px) {
  .room-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 100px;
    gap: 8px;
  }
  .room-grid-wrap {
    padding: 10px;
  }
}
</style>
