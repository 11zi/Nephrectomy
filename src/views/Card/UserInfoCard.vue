<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useContentStore } from '../../stores/useContentStore'
import { useUserStore } from '../../stores/useUserStore'
import type { PublicProfile } from '../../types/accountTypes'
import type { UserSummary } from '../../types/chatTypes'

const props = defineProps<{
  user: UserSummary
}>()
const emit = defineEmits<{
  close: []
}>()

const contentStore = useContentStore()
const userStore = useUserStore()
const profile = ref<PublicProfile | null>(null)
const isLoading = ref(false)

async function loadProfile() {
  isLoading.value = true
  try {
    profile.value = await userStore.fetchPublicProfile(props.user.id)
  } catch {
    profile.value = null
  } finally {
    isLoading.value = false
  }
}

function viewDetail() {
  contentStore.navigateToUserProfile(props.user.id)
  emit('close')
}

onMounted(loadProfile)
watch(() => props.user.id, loadProfile)
</script>

<template>
  <div class="user-info-card">
    <div class="user-info-head">
      <img :src="profile?.avatarUrl || props.user.avatarUrl" alt="avatar" class="user-info-avatar" />
      <div class="user-info-main">
        <div class="user-info-name">{{ profile?.nickname || props.user.nickname }}</div>
        <div class="user-info-motto">{{ profile?.motto || props.user.motto || '还没有签名' }}</div>
      </div>
    </div>

    <div class="user-info-grid">
      <div>
        <span>点赞</span>
        <strong>{{ profile?.likes ?? '-' }}</strong>
      </div>
      <div>
        <span>访问</span>
        <strong>{{ profile?.visitCount ?? '-' }}</strong>
      </div>
      <div>
        <span>爱好</span>
        <strong>{{ profile?.hobbies?.slice(0, 2).join(' / ') || '暂无' }}</strong>
      </div>
    </div>

    <button
      class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-blue-grey user-info-action"
      type="button"
      :disabled="isLoading"
      @click="viewDetail"
    >
      <i class="mdui-icon material-icons mdui-icon-left">person</i>
      查看详细资料
    </button>
  </div>
</template>

<style scoped>
.user-info-card {
  width: min(320px, calc(100vw - 48px));
  padding: 14px;
}

.user-info-head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-info-avatar {
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  border-radius: 50%;
  object-fit: cover;
}

.user-info-main {
  min-width: 0;
}

.user-info-name {
  overflow: hidden;
  color: #37474f;
  font-size: 16px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info-motto {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  color: #78909c;
  font-size: 12px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.user-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0;
}

.user-info-grid div {
  min-width: 0;
  padding: 8px;
  border-radius: 6px;
  background: #eceff1;
}

.user-info-grid span,
.user-info-grid strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info-grid span {
  color: #90a4ae;
  font-size: 11px;
}

.user-info-grid strong {
  margin-top: 2px;
  color: #455a64;
  font-size: 13px;
}

.user-info-action {
  width: 100%;
}
</style>
