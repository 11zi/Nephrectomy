// 管理主内容区当前显示的页面

import { ref } from 'vue'
import { defineStore } from 'pinia'

// 所有可切换的主页面类型
export type ContentPage =
  | 'chat'
  | 'room-list'
  | 'implicit-room-list'
  | 'private-message'
  | 'account-edit'
  | 'user-profile'
  | 'settings'
  | 'login'
  | 'register'

export const useContentStore = defineStore('content', () => {
  const currentPage = ref<ContentPage>('chat')
  const previousPages = ref<ContentPage[]>([])
  const profileUserId = ref<string | null>(null)

  function navigateTo(page: ContentPage) {
    currentPage.value = page
  }

  function navigateToUserProfile(userId: string) {
    if (currentPage.value !== 'user-profile') {
      previousPages.value.push(currentPage.value)
    }
    profileUserId.value = userId
    currentPage.value = 'user-profile'
  }

  function goBack() {
    const previous = previousPages.value.pop()
    currentPage.value = previous ?? 'chat'
  }

  return {
    currentPage,
    profileUserId,
    navigateTo,
    navigateToUserProfile,
    goBack,
  }
})
