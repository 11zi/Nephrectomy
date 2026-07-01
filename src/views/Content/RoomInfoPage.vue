<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Landmark, X } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useContentStore } from '../../stores/useContentStore'
import { useRoomStore } from '../../stores/useRoomStore'
import { useUserStore } from '../../stores/useUserStore'
import { useSnackbar } from '../../composables/useSnackbar'

const contentStore = useContentStore()
const roomStore = useRoomStore()
const userStore = useUserStore()
const snackbar = useSnackbar()

const repayAmount = ref('')
const isRepaying = ref(false)

const roomId = computed(() => contentStore.roomInfoRoomId || roomStore.activeRoomId)
const room = computed(() => roomStore.selectedRoomInfo)
const isOwner = computed(() => room.value?.ownerId === userStore.currentUser?.id)
const loanBalance = computed(() => room.value?.loanBalance ?? 0)

function formatMoney(value: number): string {
  return Math.floor(value).toLocaleString('zh-CN')
}

async function loadRoomInfo() {
  await roomStore.fetchRoomInfo(roomId.value)
}

async function submitRepayment() {
  const amount = Math.floor(Number(repayAmount.value))
  if (!Number.isFinite(amount) || amount <= 0) {
    snackbar.show('请输入有效还款金额')
    return
  }

  isRepaying.value = true
  try {
    await roomStore.repayRoomLoan(roomId.value, amount)
    await userStore.loadProfile()
    repayAmount.value = ''
    snackbar.show('还款成功')
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '还款失败')
  } finally {
    isRepaying.value = false
  }
}

onMounted(loadRoomInfo)
watch(roomId, loadRoomInfo)
</script>

<template>
  <div class="app-page room-info-page">
    <div class="app-page-header">
      <Button
        class="app-header-icon-button"
        variant="ghost"
        size="icon"
        type="button"
        title="返回聊天室"
        @click="contentStore.navigateTo('chat')"
      >
        <X />
      </Button>

      <div class="app-page-title">
        <span>房间信息</span>
      </div>
    </div>

    <div class="room-info-body">
      <div v-if="roomStore.isLoadingRoomInfo" class="room-info-empty">加载中...</div>

      <template v-else-if="room">
        <section class="room-info-hero" :style="{ '--cover': room.cover || '#546e7a' }">
          <div>
            <h1>{{ room.name }}</h1>
            <p>{{ room.description || '这个房间还没有简介' }}</p>
          </div>
        </section>

        <section class="room-info-grid">
          <div class="room-info-stat">
            <span>成员</span>
            <strong>{{ room.memberCount }}</strong>
          </div>
          <div class="room-info-stat">
            <span>热度</span>
            <strong>{{ room.heat }}</strong>
          </div>
          <div class="room-info-stat">
            <span>状态</span>
            <strong>{{ room.isActive ? '有人在线' : '暂无在线' }}</strong>
          </div>
          <div class="room-info-stat">
            <span>房主</span>
            <strong>{{ room.ownerName || '公共房间' }}</strong>
          </div>
        </section>

        <section class="room-info-section">
          <div class="room-info-section-title">
            <Landmark />
            房贷
          </div>
          <div class="room-info-loan">
            <div>
              <span>首付</span>
              <strong>{{ formatMoney(room.downPayment) }}</strong>
            </div>
            <div>
              <span>待还贷款</span>
              <strong>{{ formatMoney(loanBalance) }}</strong>
            </div>
          </div>

          <form v-if="isOwner && loanBalance > 0" class="room-info-repay" @submit.prevent="submitRepayment">
            <Input
              v-model="repayAmount"
              type="number"
              min="1"
              :max="loanBalance"
              placeholder="还多少都行，不强制"
            />
            <Button type="submit" :disabled="isRepaying">
              还款
            </Button>
          </form>
          <p v-else-if="isOwner" class="room-info-note">贷款已还清。</p>
          <p v-else class="room-info-note">只有房主可以在这里还款。</p>
        </section>
      </template>

      <div v-else class="room-info-empty">没有找到房间信息</div>
    </div>
  </div>
</template>

<style scoped>
.room-info-page {
  background: var(--app-bg-soft);
}

.room-info-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.room-info-hero {
  min-height: 180px;
  background: linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.08)), var(--cover);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  padding: 18px;
}

.room-info-hero h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.room-info-hero p {
  margin: 6px 0 0;
  color: rgba(255,255,255,0.82);
}

.room-info-grid,
.room-info-loan {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.room-info-stat,
.room-info-loan > div {
  background: var(--app-surface);
  border: 1px solid var(--app-border-soft);
  border-radius: 8px;
  padding: 12px;
}

.room-info-stat span,
.room-info-loan span {
  display: block;
  color: var(--app-text-muted);
  font-size: 12px;
}

.room-info-stat strong,
.room-info-loan strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
  color: var(--app-text);
}

.room-info-section {
  margin-top: 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border-soft);
  border-radius: 8px;
  padding: 14px;
}

.room-info-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.room-info-section-title svg {
  width: 18px;
  height: 18px;
  color: var(--app-text-muted);
}

.room-info-repay {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin-top: 14px;
  align-items: center;
}

.room-info-note,
.room-info-empty {
  color: var(--app-text-muted);
}

@media (max-width: 700px) {
  .room-info-grid,
  .room-info-loan {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
