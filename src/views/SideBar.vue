<!-- src/views/SideBar.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import {
  CircleHelp,
  Clock,
  Dices,
  DoorOpen,
  Edit3,
  Gavel,
  Grid3X3,
  HardDrive,
  Home,
  Info,
  Landmark,
  ListVideo,
  LogOut,
  Map,
  MessageSquare,
  RefreshCw,
  Settings,
  ShoppingCart,
  StickyNote,
  TrendingUp,
  UserSquare,
  Utensils,
  Waves,
} from 'lucide-vue-next'
import BaseCard from './Card/BaseCard.vue'
import BankPanel from './Card/BankPanel.vue'
import DicePanel from './Card/DicePanel.vue'
import StockPanel from './Card/StockPanel.vue'
import PlaybackPanel from '../components/playback/PlaybackPanel.vue'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
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
  'app-sidebar',
  isSidebarOpen.value ? 'app-sidebar-open' : 'app-sidebar-closed',
])
const sidebar = ref<HTMLElement | null>(null)
const eatingDialogOpen = ref(false)
const eatingFood = ref('')
const logoutDialogOpen = ref(false)
const isLoggingOut = ref(false)

const iconMap: Record<string, Component> = {
  home: Home,
  class: DoorOpen,
  map: Map,
  edit: Edit3,
  widgets: Grid3X3,
  account_balance: Landmark,
  timeline: TrendingUp,
  money_off: Dices,
  add_shopping_cart: ShoppingCart,
  gavel: Gavel,
  playlist_play: ListVideo,
  note: StickyNote,
  sd_card: HardDrive,
  restaurant_menu: Utensils,
  access_time: Clock,
  blur_on: Waves,
  account_box: UserSquare,
  message: MessageSquare,
  settings: Settings,
  info_outline: Info,
  refresh: RefreshCw,
  exit_to_app: LogOut,
}

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

function openLogoutDialog() {
  logoutDialogOpen.value = true
  closeSideBar(true)
}

function closeLogoutDialog() {
  if (isLoggingOut.value) return
  logoutDialogOpen.value = false
}

async function confirmLogout() {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  try {
    await userStore.logout()
    logoutDialogOpen.value = false
    contentStore.navigateTo('login' as ContentPage)
    closeSideBar(true)
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '登出失败')
  } finally {
    isLoggingOut.value = false
  }
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

const currentPresenceSummary = computed(() => getPresenceSummary())

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
  eatingFood.value = ''
  eatingDialogOpen.value = true
  closeSideBar(true)
}

function closeEatingDialog() {
  eatingDialogOpen.value = false
}

async function clearEatingStatus() {
  try {
    await userStore.clearPresenceStatus()
    closeEatingDialog()
    snackbar.show('已结束当前状态')
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '结束失败')
  }
}

async function submitEatingStatus() {
  const food = eatingFood.value.trim()
  if (!food) {
    snackbar.show('请填写在吃什么东西')
    return
  }

  try {
    closeEatingDialog()
    await userStore.setPresenceStatus({
      status: 'eating',
      detail: food,
      durationMinutes: 60,
    })
    snackbar.show('已切换为吃饭状态，最多持续 1 小时')
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '设置失败')
  }
}

function getMenuIcon(icon: string) {
  return iconMap[icon] ?? CircleHelp
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
    openLogoutDialog()
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
  <aside :class="sidebarClass" ref="sidebar" aria-label="主导航">
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

    <div class="app-sidebar-list" v-for="item in components" :key="item.index">
      <button
        class="app-sidebar-section-header noselect"
        :class="{
          'clickable-header': isHeaderClickable(item),
        }"
        type="button"
        :disabled="!isHeaderClickable(item)"
        @click="handleHeaderClick(item)"
      >
        <component :is="getMenuIcon(item.icon)" class="app-sidebar-section-icon" aria-hidden="true" />
        {{ item.name }}
      </button>
      <button
        class="app-sidebar-item"
        v-for="_item in item.child"
        :key="_item.index"
        type="button"
        @click="handleItemClick(_item)"
        :class="{ 'app-sidebar-active': isMenuItemActive(_item) }"
      >
        <div class="app-sidebar-item-content">
          <component :is="getMenuIcon(_item.icon)" class="app-sidebar-item-icon" aria-hidden="true" />
          <span class="app-sidebar-item-text">{{ _item.name }}</span>
        </div>
      </button>
    </div>
  </aside>

  <Teleport to="body">
    <div v-if="logoutDialogOpen" class="presence-dialog-backdrop" @click.self="closeLogoutDialog">
      <div class="presence-dialog logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
        <div class="presence-dialog-header">
          <div>
            <h2 id="logout-dialog-title">确认登出</h2>
            <p>登出后将返回登录页面，当前会话会被清除。</p>
          </div>
        </div>

        <div class="presence-dialog-actions">
          <Button type="button" variant="ghost" :disabled="isLoggingOut" @click="closeLogoutDialog">取消</Button>
          <Button
            type="button"
            variant="destructive"
            :disabled="isLoggingOut"
            @click="confirmLogout"
          >
            {{ isLoggingOut ? '正在登出...' : '确认登出' }}
          </Button>
        </div>
      </div>
    </div>

    <div v-if="eatingDialogOpen" class="presence-dialog-backdrop" @click.self="closeEatingDialog">
      <form class="presence-dialog" @submit.prevent="submitEatingStatus">
        <div class="presence-dialog-header">
          <div>
            <h2>吃饭</h2>
            <p v-if="currentPresenceSummary">{{ currentPresenceSummary }}</p>
          </div>
        </div>

        <label class="presence-dialog-field">
          <span>在吃什么</span>
          <Input
            v-model="eatingFood"
            maxlength="40"
            placeholder="例如：牛肉面"
            autofocus
          />
        </label>

        <div class="presence-dialog-actions">
          <Button type="button" variant="ghost" @click="closeEatingDialog">取消</Button>
          <Button
            v-if="currentPresenceSummary"
            type="button"
            variant="outline"
            @click="clearEatingStatus"
          >
            结束当前状态
          </Button>
          <Button type="submit">开始吃饭</Button>
        </div>
      </form>
    </div>
  </Teleport>
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

.presence-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(18, 28, 34, 0.42);
}

.presence-dialog {
  width: min(420px, 100%);
  border: 1px solid rgba(84, 110, 122, 0.22);
  border-radius: 8px;
  padding: 18px;
  background: var(--app-surface);
  color: var(--app-text);
  box-shadow: var(--app-shadow-floating);
}

.presence-dialog-header h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
  font-weight: 600;
}

.presence-dialog-header p {
  margin: 8px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.4;
}

.presence-dialog-field {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  color: var(--app-text-soft);
  font-size: 13px;
  font-weight: 600;
}

.presence-dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
</style>
