import { ref } from 'vue'

const SIDEBAR_WIDTH = '240px'
const MOBILE_QUERY = '(max-width: 600px)'

const isSidebarOpen = ref(false)
let resizeListenerRegistered = false

function isMobileViewport() {
  return window.matchMedia(MOBILE_QUERY).matches
}

function syncSidebarLayout(open: boolean) {
  if (typeof document === 'undefined') return

  const sidebarWidth = open && !isMobileViewport() ? SIDEBAR_WIDTH : '0px'
  document.body.style.paddingLeft = sidebarWidth
  document.documentElement.style.setProperty('--sidebar-width', sidebarWidth)
}

function ensureResizeListener() {
  if (resizeListenerRegistered || typeof window === 'undefined') return

  window.addEventListener(
    'resize',
    () => {
      syncSidebarLayout(isSidebarOpen.value)
    },
    { passive: true },
  )
  resizeListenerRegistered = true
}

function openSidebar() {
  isSidebarOpen.value = true
  syncSidebarLayout(true)
}

function closeSidebar() {
  isSidebarOpen.value = false
  syncSidebarLayout(false)
  mdui.mutation()
}

function toggleSidebar() {
  if (isSidebarOpen.value) {
    closeSidebar()
  } else {
    openSidebar()
  }
}

export function useSidebar() {
  ensureResizeListener()

  return {
    isSidebarOpen,
    isMobileViewport,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  }
}
