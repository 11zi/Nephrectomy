<!-- src/views/SideBar.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import BaseCard from './Card/BaseCard.vue'
import BankPanel from './Card/BankPanel.vue'
import DicePanel from './Card/DicePanel.vue'
import { useContentStore } from '../stores/useContentStore'
import { useRoomStore } from '../stores/useRoomStore'
import { useUserStore } from '../stores/useUserStore'
import type { ContentPage } from '../stores/useContentStore'
import type { Component } from 'vue'

const contentStore = useContentStore()
const roomStore = useRoomStore()
const userStore = useUserStore()

const components = [
  {
    name: '导航',
    vueSrc: '',
    index: '1',
    icon: 'home',
    child: [
      { name: '房间信息',  vueSrc: '', index: '1-1', icon: 'class',        navigate: null },
      { name: '房间列表',  vueSrc: '', index: '1-2', icon: 'map',          navigate: 'room-list' as ContentPage },
      { name: '编辑资料',   vueSrc: '', index: '1-3', icon: 'edit',        navigate: 'account-edit' as ContentPage },
    ],
  },
  {
    name: '板块',
    vueSrc: '',
    index: '2',
    icon: 'widgets',
    child: [
      { name: '银行', vueSrc: '', index: '2-1', icon: 'account_balance',   navigate: null },
      { name: '炒股', vueSrc: '', index: '2-2', icon: 'timeline',          navigate: null },
      { name: '骰子', vueSrc: '', index: '2-3', icon: 'money_off',         navigate: null },
      { name: '商城', vueSrc: '', index: '2-4', icon: 'add_shopping_cart', navigate: null },
    ],
  },
  {
    name: '工具',
    vueSrc: '',
    index: '3',
    icon: 'gavel',
    child: [
      { name: '点播',     vueSrc: '',                    index: '3-1', icon: 'playlist_play',   navigate: null },
      { name: '便签',     vueSrc: '',                    index: '3-2', icon: 'note',            navigate: null },
      { name: '解析',     vueSrc: '../Card/BaseCard.vue', index: '3-3', icon: 'sd_card',        navigate: null },
      { name: '吃饭',     vueSrc: '',                    index: '3-4', icon: 'restaurant_menu', navigate: null },
      { name: '时间',     vueSrc: '',                    index: '3-6', icon: 'access_time',     navigate: null },
      { name: '隐式传送', vueSrc: '',                    index: '3-5', icon: 'blur_on',         navigate: 'implicit-room-list' as ContentPage },
    ],
  },
  { name: '好友', vueSrc: '', index: '4', icon: 'account_box', child: [] },
  { name: '消息', vueSrc: '', index: '5', icon: 'message', navigate: 'private-message' as ContentPage, child: [] },
  {
    name: '系统',
    vueSrc: '',
    index: '6',
    icon: 'settings',
    child: [
      { name: '设置', vueSrc: '', index: '6-1', icon: 'settings',     navigate: null },
      { name: '关于', vueSrc: '', index: '6-2', icon: 'info_outline', navigate: null },
      { name: '重载', vueSrc: '', index: '6-3', icon: 'refresh',      navigate: null },
      { name: '登出', vueSrc: '', index: '6-4', icon: 'exit_to_app',  navigate: 'logout' as unknown as ContentPage },
    ],
  },
]

const isSidebarOpen = ref(false)
const isActive = ref<Record<string, boolean>>({})
const stackIndexMap = ref<Record<string, number>>({})
let openCount = 0

const drawerEl = ref<HTMLElement | null>(null)
const panelComponents: Record<string, Component> = {
  银行: BankPanel,
  骰子: DicePanel,
}

const sidebarClass = ref([
  'mdui-drawer',
  'mdui-drawer-close',
  'mdui-color-blue-grey',
])
const sidebar = ref(null)

onClickOutside(sidebar, closeSideBar)
for (const item of components) {
  for (const _item of item.child) {
    isActive.value[_item.name] = false
    stackIndexMap.value[_item.name] = 0
  }
}

function openSideBar() {
  isSidebarOpen.value = true
  document.body.style.paddingLeft = '240px'
  document.documentElement.style.setProperty('--sidebar-width', '240px')
  sidebarClass.value[1] = 'mdui-drawer-open'
}
function closeSideBar() {
  isSidebarOpen.value = false
  document.body.style.paddingLeft = '0px'
  document.documentElement.style.setProperty('--sidebar-width', '0px')
  sidebarClass.value[1] = 'mdui-drawer-close'
  mdui.mutation()
}

async function handleLogout() {
  await userStore.logout()
  contentStore.navigateTo('login' as ContentPage)
  closeSideBar()
}

function handleItemClick(item: {
  name: string
  vueSrc: string
  navigate?: ContentPage | null
}) {
  if (item.navigate === ('logout' as ContentPage)) {
    handleLogout()
    return
  }
  if (item.navigate) {
    contentStore.navigateTo(item.navigate)
    closeSideBar()
  } else {
    togglePanel(item.name)
  }
}

function handleHeaderClick(item: { navigate?: ContentPage | null }) {
  if (!item.navigate) return
  contentStore.navigateTo(item.navigate)
  closeSideBar()
}

const assignedPanels = new Set<string>()

// toggle：已开启则关闭，未开启则打开
function togglePanel(panelName: string) {
  if (isActive.value[panelName]) {
    isActive.value[panelName] = false
  } else {
    // 只在第一次打开时分配 stackIndex，之后复用同一偏移
    if (!assignedPanels.has(panelName)) {
      stackIndexMap.value[panelName] = openCount++
      assignedPanels.add(panelName)
    }
    isActive.value[panelName] = true
  }
}

function closePanel(panelName: string) {
  isActive.value[panelName] = false
}

function closeAllPanels() {
  for (const panelName of Object.keys(isActive.value)) {
    isActive.value[panelName] = false
  }
}

watch(
  () => roomStore.activeRoomId,
  () => {
    closeAllPanels()
  },
)
</script>

<template>
  <div
    style="height: 100%; width: 1px; position: absolute; left: 0px"
    @mouseenter="openSideBar"
  ></div>

  <!-- 浮动卡片层 -->
  <div>
    <div v-for="item in components" :key="item.index">
      <div v-for="_item in item.child" :key="_item.index">
        <component
          v-if="isActive[_item.name]"
          :is="BaseCard"
          @closePanel="closePanel(_item.name)"
          :panelName="_item.name"
          :stackIndex="stackIndexMap[_item.name]"
          :contentComponent="panelComponents[_item.name] ?? null"
        />
      </div>
    </div>
  </div>

  <!-- 侧边栏 -->
  <div :class="sidebarClass" ref="sidebar" swipe="true" overlay="true">
    <div class="mdui-container mdui-p-a-2">
      <div class="sidebar-profile">
        <div class="avatar-wrapper">
          <img
            :src="userStore.currentUser?.avatarUrl"
            alt="avatar"
            class="mdui-img-rounded mdui-shadow-2"
            width="80"
            height="80"
          />
          <!-- 在线状态指示灯 -->
          <span
            class="online-dot"
            :class="{ online: userStore.isOnline }"
            :title="userStore.isOnline ? '在线' : '离线'"
          ></span>
        </div>
        <div class="profile-text">
          <div
            class="profile-motto mdui-list-item-three-line mdui-typo-caption noselect"
            :title="userStore.currentUser?.motto ?? '还没有签名'"
          >
            {{ userStore.currentUser?.motto ?? '还没有签名' }}
          </div>
          <div class="profile-name mdui-typo-title noselect">
            {{ userStore.currentUser?.nickname ?? '未登录' }}
          </div>
        </div>
      </div>
    </div>

    <ul class="mdui-list" v-for="item in components" :key="item.index">
      <li></li>
      <li
        class="mdui-subheader noselect"
        :class="{ 'mdui-ripple': item.navigate, 'clickable-header': item.navigate }"
        @click="handleHeaderClick(item)"
      >
        <i class="mdui-icon material-icons mdui-m-r-1">{{ item.icon }}</i>
        {{ item.name }}
      </li>
      <li
        class="mdui-list-item mdui-ripple"
        v-for="_item in item.child"
        :key="_item.index"
        @click="handleItemClick(_item)"
      >
        &nbsp;&nbsp;&nbsp;&nbsp;
        <div class="mdui-list-item-content">
          <i class="mdui-list-item-icon mdui-icon material-icons mdui-m-r-1">{{ _item.icon }}</i>
          {{ _item.name }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style>
.noselect {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.clickable-header {
  cursor: pointer;
}

.sidebar-profile {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

/* 头像 + 在线状态指示器 */
.avatar-wrapper {
  position: relative;
  flex: 0 0 80px;
  width: 80px;
  height: 80px;
}

.avatar-wrapper img {
  display: block;
}

.profile-text {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 80px;
  overflow: hidden;
}

.profile-motto {
  height: 48px;
  max-height: 48px;
  max-width: 100%;
  overflow: hidden;
  opacity: 0.87;
  padding-top: 2px;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  line-height: 16px;
  white-space: normal;
  font-weight: 200;
}

.profile-name {
  display: flex;
  align-items: center;
  height: 28px;
  margin-top: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #bdbdbd;
  border: 2px solid #fff;
  transition: background 0.3s;
}

.online-dot.online {
  background: #4caf50;
}
</style>
