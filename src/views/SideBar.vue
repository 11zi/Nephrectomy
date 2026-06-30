<!-- src/views/SideBar.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import BaseCard from './Card/BaseCard.vue'
import BankPanel from './Card/BankPanel.vue'
import DicePanel from './Card/DicePanel.vue'
import StockPanel from './Card/StockPanel.vue'
import PlaybackPanel from '../components/playback/PlaybackPanel.vue'
import { useContentStore } from '../stores/useContentStore'
import { useRoomStore } from '../stores/useRoomStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUserStore } from '../stores/useUserStore'
import { useSnackbar } from '../composables/useSnackbar'
import { requestInsertChatText } from '../composables/useChatInput'
import { useSidebar } from '../composables/useSidebar'
import type { ContentPage } from '../stores/useContentStore'
import type { Component } from 'vue'

const contentStore = useContentStore()
const roomStore = useRoomStore()
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const snackbar = useSnackbar()
const { isSidebarOpen, isMobileViewport, openSidebar, closeSidebar } = useSidebar()

const components = [
  {
    name: '导航',
    vueSrc: '',
    index: '1',
    icon: 'home',
    child: [
      { name: '房间信息',  vueSrc: '', index: '1-1', icon: 'class',        navigate: 'room-info' as ContentPage },
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
      { name: '商城', vueSrc: '', index: '2-4', icon: 'add_shopping_cart', navigate: 'shop' as ContentPage },
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
      { name: '设置', vueSrc: '', index: '6-1', icon: 'settings',     navigate: 'settings' as ContentPage },
      { name: '关于', vueSrc: '', index: '6-2', icon: 'info_outline', navigate: null },
      { name: '重载', vueSrc: '', index: '6-3', icon: 'refresh',      navigate: null },
      { name: '登出', vueSrc: '', index: '6-4', icon: 'exit_to_app',  navigate: 'logout' as unknown as ContentPage },
    ],
  },
]

const isActive = ref<Record<string, boolean>>({})
const stackIndexMap = ref<Record<string, number>>({})
let openCount = 0

const panelComponents: Record<string, Component> = {
  点播: PlaybackPanel,
  银行: BankPanel,
  炒股: StockPanel,
  骰子: DicePanel,
}

const sidebarClass = computed(() => [
  'mdui-drawer',
  isSidebarOpen.value ? 'mdui-drawer-open' : 'mdui-drawer-close',
  'app-sidebar',
])
const sidebar = ref<HTMLElement | null>(null)

onClickOutside(sidebar, () => closeSideBar())
for (const item of components) {
  for (const _item of item.child) {
    isActive.value[_item.name] = false
    stackIndexMap.value[_item.name] = 0
  }
}

function openSideBar() {
  openSidebar()
}
function closeSideBar(force = false) {
  if (settingsStore.keepSidebarOpen && !force && !isMobileViewport()) return

  closeSidebar()
}

async function handleLogout() {
  await userStore.logout()
  contentStore.navigateTo('login' as ContentPage)
  closeSideBar(true)
}

function formatCurrentTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function insertCurrentTimeToChatInput() {
  contentStore.navigateTo('chat')
  requestAnimationFrame(() => {
    requestInsertChatText(formatCurrentTime())
  })
  closeSideBar()
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getPresenceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    eating: '吃饭',
    sleeping: '睡觉',
    bathing: '洗澡',
    away: '外出',
    dead: '似',
  }
  return labels[status] ?? status
}

function getPresenceSummary() {
  const profile = userStore.profile
  if (!profile?.presenceStatus || !profile.presenceUntil) return ''

  const remainingMs = new Date(profile.presenceUntil).getTime() - Date.now()
  if (remainingMs <= 0) return ''

  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000))
  const label = getPresenceStatusLabel(profile.presenceStatus)
  const detail = profile.presenceDetail ? `：${profile.presenceDetail}` : ''
  return `当前状态：${label}${detail}，约 ${remainingMinutes} 分钟后结束。`
}

const activePresenceStatus = computed(() => {
  const profile = userStore.profile
  if (!profile?.presenceStatus || !profile.presenceUntil) return ''

  const remainingMs = new Date(profile.presenceUntil).getTime() - Date.now()
  return remainingMs > 0 ? profile.presenceStatus : ''
})

const sidebarStatusDotClass = computed(() => ({
  online: userStore.isOnline && !activePresenceStatus.value,
  eating: activePresenceStatus.value === 'eating',
  away: Boolean(activePresenceStatus.value && activePresenceStatus.value !== 'eating'),
}))

const sidebarStatusTitle = computed(() => {
  const summary = getPresenceSummary()
  if (summary) return summary
  return userStore.isOnline ? '在线' : '离线'
})

function openEatingDialog() {
  const inputId = `eating-food-${Date.now()}`
  const currentSummary = getPresenceSummary()
  let dialogController: { close: () => void } | null = null
  const buttons: Array<{
    text: string
    bold?: boolean
    close?: boolean
    onClick?: () => void
  }> = [
    {
      text: '取消',
      close: true,
    },
  ]

  if (currentSummary) {
    buttons.push({
      text: '结束当前状态',
      close: false,
      onClick: async () => {
        try {
          await userStore.clearPresenceStatus()
          dialogController?.close()
          snackbar.show('已结束当前状态')
        } catch (err) {
          snackbar.show(err instanceof Error ? err.message : '结束失败')
        }
      },
    })
  }

  buttons.push({
    text: '开始吃饭',
    bold: true,
    close: false,
    onClick: async () => {
      const input = document.getElementById(inputId) as HTMLInputElement | null
      const food = input?.value.trim() ?? ''
      if (!food) {
        snackbar.show('请填写在吃什么东西')
        input?.focus()
        return
      }

      try {
        dialogController?.close()
        await userStore.setPresenceStatus({
          status: 'eating',
          detail: food,
          durationMinutes: 60,
        })
        snackbar.show('已切换为吃饭状态，最多持续 1 小时')
      } catch (err) {
        snackbar.show(err instanceof Error ? err.message : '设置失败')
      }
    },
  })

  const summaryHtml = currentSummary
    ? `<p style="margin:0 0 10px;color:#455a64;font-size:13px">${escapeHtml(currentSummary)}</p>`
    : ''
  mdui.dialog({
    title: '吃饭',
    content: `
      <div style="padding-top:4px">
        ${summaryHtml}
        <div class="mdui-textfield" style="padding-top:0">
          <label class="mdui-textfield-label">在吃什么</label>
          <input id="${inputId}" class="mdui-textfield-input" type="text" maxlength="40" placeholder="例如：牛肉面" />
        </div>
      </div>
    `,
    buttons,
    onOpened: (dialog) => {
      dialogController = dialog
      requestAnimationFrame(() => {
        mdui.mutation()
        document.getElementById(inputId)?.focus()
      })
    },
  })
  closeSideBar(true)
}

function openCurrentUserProfile() {
  if (!userStore.currentUser) return
  contentStore.navigateToUserProfile(userStore.currentUser.id)
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
  if (item.name === '时间') {
    insertCurrentTimeToChatInput()
    return
  }
  if (item.name === '吃饭') {
    openEatingDialog()
    return
  }
  if (item.navigate) {
    contentStore.navigateTo(item.navigate)
    closeSideBar()
  } else if (panelComponents[item.name]) {
    togglePanel(item.name)
  } else {
    snackbar.show('此功能开发中^_^')
  }
}

function handleHeaderClick(item: { child?: unknown[]; navigate?: ContentPage | null }) {
  if (!item.navigate) {
    if (!item.child?.length) {
      snackbar.show('此功能开发中^_^')
    }
    return
  }
  contentStore.navigateTo(item.navigate)
  closeSideBar()
}

function isHeaderClickable(item: { child?: unknown[]; navigate?: ContentPage | null }) {
  return Boolean(item.navigate || !item.child?.length)
}

function isMenuItemActive(item: { name: string }) {
  return Boolean(panelComponents[item.name] && isActive.value[item.name])
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

watch(
  () => settingsStore.keepSidebarOpen,
  (keepSidebarOpen) => {
    if (keepSidebarOpen && !isMobileViewport()) {
      openSideBar()
    }
  },
)
</script>

<template>
  <div
    class="app-sidebar-edge-trigger"
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
    <div class="app-sidebar-profile-wrap">
      <div class="app-sidebar-profile">
        <div
          class="app-sidebar-avatar"
          title="查看详细资料"
          @click="openCurrentUserProfile"
        >
          <img
            :src="userStore.currentUser?.avatarUrl"
            alt="avatar"
            width="80"
            height="80"
          />
          <!-- 在线状态指示灯 -->
          <span
            class="app-sidebar-status-dot"
            :class="sidebarStatusDotClass"
            :title="sidebarStatusTitle"
          ></span>
        </div>
        <div class="app-sidebar-profile-text">
          <div
            class="app-sidebar-motto noselect"
            :title="userStore.currentUser?.motto ?? '还没有签名'"
          >
            {{ userStore.currentUser?.motto ?? '还没有签名' }}
          </div>
          <div class="app-sidebar-name noselect">
            {{ userStore.currentUser?.nickname ?? '未登录' }}
          </div>
        </div>
      </div>
    </div>

    <ul class="mdui-list app-sidebar-list" v-for="item in components" :key="item.index">
      <li
        class="mdui-subheader noselect"
        :class="{
          'mdui-ripple': isHeaderClickable(item),
          'clickable-header': isHeaderClickable(item),
        }"
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
        :class="{ 'app-sidebar-active': isMenuItemActive(_item) }"
      >
        <div class="mdui-list-item-content app-sidebar-item-content">
          <i class="mdui-list-item-icon mdui-icon material-icons">{{ _item.icon }}</i>
          <span class="app-sidebar-item-text">{{ _item.name }}</span>
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

</style>
