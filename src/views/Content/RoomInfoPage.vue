<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Bell, BellOff, EyeOff, Hammer, Landmark, RotateCcw, UserPlus, Users, X } from 'lucide-vue-next'
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
const isDemolishing = ref(false)
const isReopening = ref(false)
const isSubscribing = ref(false)
const addingMemberId = ref<string | null>(null)

const roomId = computed(() => contentStore.roomInfoRoomId || roomStore.activeRoomId)
const room = computed(() => roomStore.selectedRoomInfo)
const isOwner = computed(() => room.value?.ownerId === userStore.currentUser?.id)
const loanBalance = computed(() => room.value?.loanBalance ?? 0)
const isDemolished = computed(() => Boolean(room.value?.isHidden || room.value?.ownerOnly))
const memberUidSet = computed(() => new Set(room.value?.members.map(user => user.uid) ?? []))
const pendingSubscribers = computed(() =>
  room.value?.subscribers.filter(user => !memberUidSet.value.has(user.uid)) ?? [],
)

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

async function demolishRoom() {
  if (!isOwner.value || !room.value) return

  const message = loanBalance.value > 0
    ? `拆除后会免除 ${formatMoney(loanBalance.value)} 贷款，并隐藏房间，只允许你进入。确定拆除吗？`
    : '拆除后房间会被隐藏，只允许你进入。确定拆除吗？'

  if (!window.confirm(message)) return

  isDemolishing.value = true
  try {
    await roomStore.demolishRoom(roomId.value)
    snackbar.show('房间已拆除，债务已免除')
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '拆除房间失败')
  } finally {
    isDemolishing.value = false
  }
}

async function reopenRoom() {
  if (!isOwner.value || !room.value) return
  isReopening.value = true
  try {
    await roomStore.reopenRoom(roomId.value)
    snackbar.show('房间已恢复开放')
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '恢复房间失败')
  } finally {
    isReopening.value = false
  }
}

async function toggleSubscription() {
  if (!room.value) return
  isSubscribing.value = true
  try {
    if (room.value.isSubscribed) {
      await roomStore.unsubscribeRoom(roomId.value)
      snackbar.show('已取消订阅')
    } else {
      await roomStore.subscribeRoom(roomId.value)
      snackbar.show('已订阅房间')
    }
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '订阅操作失败')
  } finally {
    isSubscribing.value = false
  }
}

async function addMember(userId: string) {
  if (!isOwner.value || !room.value) return
  addingMemberId.value = userId
  try {
    await roomStore.addRoomMember(roomId.value, userId)
    snackbar.show('已添加为房间成员')
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '添加成员失败')
  } finally {
    addingMemberId.value = null
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
            <span>成员数</span>
            <strong>{{ room.memberCount }}</strong>
          </div>
          <div class="room-info-stat">
            <span>在线人数</span>
            <strong>{{ room.onlineCount }}</strong>
          </div>
          <div class="room-info-stat room-info-subscribe-stat">
            <span>订阅人数</span>
            <strong>{{ room.subscriberCount }}</strong>
            <Button
              class="room-info-subscribe-button"
              size="sm"
              type="button"
              :variant="room.isSubscribed ? 'outline' : 'default'"
              :disabled="isSubscribing"
              @click="toggleSubscription"
            >
              <BellOff v-if="room.isSubscribed" />
              <Bell v-else />
              {{ isSubscribing ? '处理中...' : room.isSubscribed ? '取消订阅' : '订阅' }}
            </Button>
          </div>
          <div class="room-info-stat">
            <span>状态</span>
            <strong>{{ isDemolished ? '已隐藏' : room.isActive ? '有人在线' : '暂无在线' }}</strong>
          </div>
          <div class="room-info-stat">
            <span>房主</span>
            <strong>{{ room.ownerName || '公共房间' }}</strong>
          </div>
        </section>

        <section class="room-info-section">
          <div class="room-info-section-title">
            <Users />
            房间成员
          </div>
          <div class="room-info-user-list">
            <span v-if="room.members.length === 0" class="room-info-note">暂无成员</span>
            <div v-for="member in room.members" :key="member.uid" class="room-info-user-row">
              <img :src="member.avatarUrl" alt="avatar" />
              <div>
                <strong>{{ member.nickname }}</strong>
                <span>{{ member.identityId || member.uid }}</span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="isOwner && room.ownerId" class="room-info-section">
          <div class="room-info-section-title">
            <UserPlus />
            订阅用户
          </div>
          <div class="room-info-user-list">
            <span v-if="pendingSubscribers.length === 0" class="room-info-note">暂无可添加的订阅用户</span>
            <div v-for="subscriber in pendingSubscribers" :key="subscriber.uid" class="room-info-user-row">
              <img :src="subscriber.avatarUrl" alt="avatar" />
              <div>
                <strong>{{ subscriber.nickname }}</strong>
                <span>{{ subscriber.identityId || subscriber.uid }}</span>
              </div>
              <Button
                size="sm"
                type="button"
                :disabled="addingMemberId === subscriber.uid"
                @click="addMember(subscriber.uid)"
              >
                <UserPlus />
                {{ addingMemberId === subscriber.uid ? '添加中' : '添加成员' }}
              </Button>
            </div>
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

        <section v-if="isOwner && room.ownerId" class="room-info-section">
          <div class="room-info-section-title">
            <Hammer />
            拆除房间
          </div>

          <div class="room-info-demolish-state" :class="{ active: isDemolished }">
            <EyeOff />
            <span>
              {{ isDemolished ? '房间已隐藏，只有房主可以进入。' : '拆除后会免除债务，并暂时禁止其他用户加入。' }}
            </span>
          </div>

          <div class="room-info-actions">
            <Button
              v-if="!isDemolished"
              type="button"
              variant="destructive"
              :disabled="isDemolishing"
              @click="demolishRoom"
            >
              <Hammer />
              {{ isDemolishing ? '拆除中...' : '拆除房间' }}
            </Button>
            <Button
              v-else
              type="button"
              :disabled="isReopening"
              @click="reopenRoom"
            >
              <RotateCcw />
              {{ isReopening ? '恢复中...' : '恢复开放' }}
            </Button>
          </div>
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

.room-info-subscribe-stat {
  display: grid;
  align-content: start;
}

.room-info-subscribe-button {
  width: 100%;
  margin-top: 10px;
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

.room-info-user-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.room-info-user-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border-radius: 8px;
  padding: 8px;
  background: #eceff1;
}

.room-info-user-row img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(84, 110, 122, 0.16);
}

.room-info-user-row strong,
.room-info-user-row span {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-info-user-row strong {
  color: var(--app-text);
  font-size: 13px;
}

.room-info-user-row span {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
}

.room-info-repay {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin-top: 14px;
  align-items: center;
}

.room-info-demolish-state {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  border-radius: 8px;
  padding: 10px 12px;
  background: #eceff1;
  color: var(--app-text-muted);
  font-size: 13px;
}

.room-info-demolish-state.active {
  background: rgba(84, 110, 122, 0.16);
  color: var(--app-text);
}

.room-info-demolish-state svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.room-info-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
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

  .room-info-user-row {
    grid-template-columns: 36px minmax(0, 1fr);
  }

  .room-info-user-row button {
    grid-column: 1 / -1;
  }
}
</style>
