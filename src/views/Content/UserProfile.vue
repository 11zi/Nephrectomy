<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useContentStore } from '../../stores/useContentStore'
import { useUserStore } from '../../stores/useUserStore'
import { useSnackbar } from '../../composables/useSnackbar'
import type { PublicProfile } from '../../types/accountTypes'

const contentStore = useContentStore()
const userStore = useUserStore()
const snackbar = useSnackbar()

const profile = ref<PublicProfile | null>(null)
const isLoading = ref(false)
const isLiking = ref(false)

const targetUserId = computed(() => contentStore.profileUserId || userStore.currentUser?.id || '')
const isSelf = computed(() => targetUserId.value === userStore.currentUser?.id)
const backgroundImage = computed(() => profile.value?.albums?.[0] || '')

function formatDate(value?: string) {
  if (!value) return '未填写'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('zh-CN')
}

async function loadProfile() {
  if (!targetUserId.value) return
  isLoading.value = true
  try {
    profile.value = await userStore.fetchPublicProfile(targetUserId.value)
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '资料加载失败')
  } finally {
    isLoading.value = false
  }
}

async function likeProfile() {
  if (!targetUserId.value || isSelf.value || profile.value?.likedToday) return
  isLiking.value = true
  try {
    profile.value = await userStore.likeProfile(targetUserId.value)
    snackbar.success('已点赞')
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '点赞失败')
  } finally {
    isLiking.value = false
  }
}

function openUserProfile(userId: string) {
  contentStore.navigateToUserProfile(userId)
}

onMounted(loadProfile)
watch(targetUserId, loadProfile)
</script>

<template>
  <div class="app-page user-profile-page">
    <div class="app-page-header">
      <button
        class="mdui-btn mdui-btn-icon mdui-ripple"
        type="button"
        title="返回"
        @click="contentStore.goBack()"
      >
        <i class="mdui-icon material-icons">close</i>
      </button>

      <div class="app-page-title">
        <span>详细资料</span>
      </div>
    </div>

    <div class="app-scroll user-profile-body">
      <div v-if="isLoading && !profile" class="user-profile-empty">资料加载中…</div>

      <template v-else-if="profile">
        <div class="user-profile-hero">
          <div class="user-profile-identity">
            <img :src="profile.avatarUrl" alt="avatar" class="user-profile-avatar" />
            <div class="user-profile-name">{{ profile.nickname }}</div>
            <div class="user-profile-motto">{{ profile.motto || '还没有签名' }}</div>
          </div>

          <div
            class="user-profile-cover"
            :class="{ empty: !backgroundImage }"
            :style="backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined"
          >
            <span v-if="!backgroundImage">背景图片</span>
          </div>
        </div>

        <div class="user-profile-grid">
          <section class="mdui-card user-profile-section">
            <div class="user-profile-section-title">基本信息</div>
            <div class="user-profile-fields">
              <div class="user-profile-field">
                <i class="mdui-icon material-icons">wc</i>
                <span>性别</span>
                <strong>{{ profile.gender ? '男' : '女' }}</strong>
              </div>
              <div class="user-profile-field">
                <i class="mdui-icon material-icons">cake</i>
                <span>生日</span>
                <strong>{{ formatDate(profile.birthday) }}</strong>
              </div>
              <div class="user-profile-field">
                <i class="mdui-icon material-icons">location_on</i>
                <span>住址</span>
                <strong>{{ profile.address || '未填写' }}</strong>
              </div>
            </div>
          </section>

          <section class="mdui-card user-profile-section user-profile-stats-section">
            <div class="user-profile-section-title">统计</div>
            <div class="user-profile-stats">
              <div>
                <span>点赞</span>
                <strong>{{ profile.likes }}</strong>
              </div>
              <div>
                <span>访问</span>
                <strong>{{ profile.visitCount }}</strong>
              </div>
            </div>
          </section>

          <section class="mdui-card user-profile-section">
            <div class="user-profile-section-title">爱好</div>
            <div class="user-profile-chips">
              <span v-if="!profile.hobbies.length" class="user-profile-muted">暂无爱好</span>
              <span v-for="hobby in profile.hobbies" :key="hobby" class="mdui-chip">
                <span class="mdui-chip-title">{{ hobby }}</span>
              </span>
            </div>
          </section>

          <section class="mdui-card user-profile-section user-profile-likes-section">
            <div class="user-profile-section-head">
              <div class="user-profile-section-title">最近点赞</div>
              <button
                class="mdui-btn mdui-btn-raised mdui-ripple user-like-button"
                :class="{ 'mdui-color-blue-grey': !profile.likedToday && !isSelf }"
                type="button"
                :disabled="isSelf || profile.likedToday || isLiking"
                @click="likeProfile"
              >
                <i class="mdui-icon material-icons mdui-icon-left">thumb_up</i>
                {{ isSelf ? '自己的资料' : profile.likedToday ? '今日已点赞' : '点赞' }}
              </button>
            </div>
            <div class="user-profile-chips">
              <span v-if="!profile.recentLikeUsers.length" class="user-profile-muted">暂无点赞</span>
              <button
                v-for="user in profile.recentLikeUsers"
                :key="user.uid"
                class="mdui-chip user-like-user"
                type="button"
                @click="openUserProfile(user.uid)"
              >
                <span class="mdui-chip-title">{{ user.nickname }}</span>
              </button>
            </div>
          </section>

          <section class="mdui-card user-profile-section user-profile-contact-section">
            <div class="user-profile-section-title">联系</div>
            <div class="user-profile-fields">
              <div class="user-profile-field">
                <i class="mdui-icon material-icons">email</i>
                <span>邮箱</span>
                <strong>{{ profile.email || '未填写' }}</strong>
              </div>
              <div class="user-profile-field">
                <i class="mdui-icon material-icons">link</i>
                <span>个人网站</span>
                <strong>{{ profile.website || '未填写' }}</strong>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.user-profile-page {
  background: var(--app-bg-soft);
}

.user-profile-body {
  --profile-content-max: 1180px;
  padding-bottom: 24px;
}

.user-profile-empty {
  padding: 40px 0;
  text-align: center;
  color: #90a4ae;
}

.user-profile-hero {
  display: grid;
  grid-template-columns: minmax(220px, 320px) minmax(320px, 1fr);
  gap: 16px;
  align-items: stretch;
  max-width: var(--profile-content-max);
  margin: 0 auto;
  padding: 24px 16px 12px;
}

.user-profile-identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.user-profile-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.user-profile-name {
  margin-top: 12px;
  color: #37474f;
  font-size: 20px;
  font-weight: 700;
}

.user-profile-motto {
  max-width: min(420px, 100%);
  margin-top: 4px;
  color: #78909c;
  font-size: 13px;
  text-align: left;
}

.user-profile-cover {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed rgba(84, 110, 122, 0.22);
  border-radius: 8px;
  background-color: rgba(236, 239, 241, 0.66);
  background-position: center;
  background-size: cover;
  color: #b0bec5;
  font-size: 12px;
  font-weight: 600;
}

.user-profile-cover:not(.empty) {
  border-style: solid;
}

.user-profile-section {
  padding: 16px;
}

.user-profile-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  max-width: var(--profile-content-max);
  margin: 4px auto 0;
  padding: 0 16px;
}

.user-profile-grid > .user-profile-section {
  grid-column: span 6;
}

.user-profile-stats-section {
  grid-column: span 3 !important;
}

.user-profile-likes-section,
.user-profile-contact-section {
  grid-column: span 6 !important;
}

.user-profile-section-title {
  color: #546e7a;
  font-size: 12px;
  font-weight: 700;
}

.user-profile-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eceff1;
}

.user-profile-section > .user-profile-section-title {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eceff1;
}

.user-like-button {
  flex: 0 0 auto;
}

.user-profile-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.user-profile-stats div {
  min-width: 0;
  padding: 10px;
  border-radius: 6px;
  background: #eceff1;
}

.user-profile-stats span,
.user-profile-stats strong {
  display: block;
}

.user-profile-stats span {
  color: #90a4ae;
  font-size: 11px;
}

.user-profile-stats strong {
  margin-top: 2px;
  color: #37474f;
  font-size: 18px;
}

.user-profile-fields {
  display: grid;
  gap: 8px;
}

.user-profile-field {
  display: grid;
  grid-template-columns: 28px 72px minmax(0, 1fr);
  align-items: center;
  min-height: 36px;
  color: #78909c;
}

.user-profile-field .mdui-icon {
  color: #78909c;
  font-size: 22px;
}

.user-profile-field strong {
  min-width: 0;
  overflow: hidden;
  color: #455a64;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-profile-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
}

.user-profile-muted {
  color: #b0bec5;
  font-size: 13px;
}

.user-like-user {
  border: none;
  cursor: pointer;
}

@media (max-width: 720px) {
  .user-profile-hero {
    grid-template-columns: 1fr;
  }

  .user-profile-grid > .user-profile-section,
  .user-profile-stats-section,
  .user-profile-likes-section,
  .user-profile-contact-section {
    grid-column: 1 / -1 !important;
  }
}

@media (max-width: 600px) {
  .user-profile-body {
    padding: 10px;
    padding-bottom: calc(18px + var(--app-safe-area-bottom));
  }

  .user-profile-hero {
    gap: 10px;
    padding: 8px 0 4px;
  }

  .user-profile-identity {
    align-items: center;
    text-align: center;
  }

  .user-profile-avatar {
    width: 82px;
    height: 82px;
  }

  .user-profile-name {
    max-width: 100%;
    overflow: hidden;
    font-size: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-profile-motto {
    text-align: center;
  }

  .user-profile-cover {
    min-height: 112px;
  }

  .user-profile-grid {
    gap: 10px;
    padding: 0;
  }

  .user-profile-section {
    padding: 12px;
  }

  .user-profile-section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .user-like-button {
    width: 100%;
  }

  .user-profile-field {
    grid-template-columns: 26px 58px minmax(0, 1fr);
    font-size: 13px;
  }

  .user-profile-field strong {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}

@media (min-width: 1100px) {
  .user-profile-grid > .user-profile-section {
    grid-column: span 4;
  }

  .user-profile-likes-section {
    grid-column: span 5 !important;
  }

  .user-profile-contact-section {
    grid-column: span 4 !important;
  }
}
</style>
