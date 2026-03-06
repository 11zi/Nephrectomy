// 管理主内容区当前显示的页面

import { ref } from 'vue'
import { defineStore } from 'pinia'

// 所有可切换的主页面类型
export type ContentPage = 'chat' | 'room-list' | 'private-message'

export const useContentStore = defineStore('content', () => {
  const currentPage = ref<ContentPage>('chat')

  function navigateTo(page: ContentPage) {
    currentPage.value = page
  }

  return { currentPage, navigateTo }
})