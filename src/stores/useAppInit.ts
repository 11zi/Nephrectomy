/**
 * 应用初始化：检查认证 → 加载资料 → 房间列表 → 当前房间历史消息
 *
 * 在 App.vue onMounted 中调用 initApp()，确保所有数据就绪再渲染。
 * Store 自身不再在创建时自动发请求，调用方完全控制 loading/error 时机。
 */
import { ref } from 'vue'
import { useUserStore } from '../stores/useUserStore'
import { useRoomStore } from '../stores/useRoomStore'
import { useChatStore } from '../stores/useChatStore'
import { useContentStore } from '../stores/useContentStore'
import type { ContentPage } from '../stores/useContentStore'

export function useAppInit() {
  const isReady = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function initApp(): Promise<void> {
    if (isLoading.value && isReady.value) return
    isLoading.value = true
    error.value = null

    try {
      const userStore = useUserStore()
      const roomStore = useRoomStore()
      const chatStore = useChatStore()
      const contentStore = useContentStore()

      // 0. 检查是否有已存储的 token，若有则验证
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          await userStore.fetchMe()
        } catch {
          // token 无效或过期 → 跳转登录页
          userStore.clearAuth()
          contentStore.navigateTo('login' as ContentPage)
          isReady.value = true
          isLoading.value = false
          return
        }
      } else {
        // 无 token → 跳转登录页
        contentStore.navigateTo('login' as ContentPage)
        isReady.value = true
        isLoading.value = false
        return
      }

      // 1. 加载用户资料
      await userStore.loadProfile()

      // 2. 加载房间列表
      await roomStore.fetchRoomList()

      roomStore.setActiveRoom(userStore.profile?.currentRoom)

      // 3. 加载当前活跃房间的历史消息。默认房间始终是广场。
      await chatStore.fetchRoomMessages({ roomId: roomStore.activeRoomId, limit: 50 })

      isReady.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      isLoading.value = false
    }
  }

  return { isReady, isLoading, error, initApp }
}
