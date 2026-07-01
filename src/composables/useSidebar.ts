import { ref } from 'vue'

const SIDEBAR_WIDTH = '240px'
const MOBILE_QUERY = '(max-width: 600px)'
const CLOSED_CONTENT_GAP = '10px'

const isSidebarOpen = ref(false)
let resizeListenerRegistered = false

function isMobileViewport() {
  return window.matchMedia(MOBILE_QUERY).matches
}

function syncSidebarLayout(open: boolean) {
  if (typeof document === 'undefined') return

  const sidebarWidth = open && !isMobileViewport() ? SIDEBAR_WIDTH : '0px'
  const contentLeftGap = open && !isMobileViewport() ? '0px' : CLOSED_CONTENT_GAP
  document.body.style.paddingLeft = sidebarWidth
  document.documentElement.style.setProperty('--sidebar-width', sidebarWidth)
  document.documentElement.style.setProperty('--content-left-gap', contentLeftGap)
}

function ensureResizeListener() {
  if (typeof window === 'undefined') return

  syncSidebarLayout(isSidebarOpen.value)
  if (resizeListenerRegistered) return

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
