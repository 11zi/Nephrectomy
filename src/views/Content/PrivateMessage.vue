<!-- TODO: 私聊页面（占位，待实现） -->
<script setup lang="ts">
import { MessageSquare, X } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { useContentStore } from '../../stores/useContentStore'
const contentStore = useContentStore()
</script>

<template>
  <div class="app-page">
    <div class="app-page-header">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        title="返回聊天室"
        @click="contentStore.navigateTo('chat')"
      >
        <X />
      </Button>

      <div class="app-page-title">
        <MessageSquare />
        <span>消息</span>
      </div>
    </div>

    <div class="app-scroll">
      <!-- TODO: 私聊内容待实现 -->
    </div>
  </div>
</template>
