<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { httpChatApi } from '../../api/httpChatApi'
import { useUserStore } from '../../stores/useUserStore'
import { useSnackbar } from '../../composables/useSnackbar'
import type { BankStatus } from '../../types/bankTypes'

const userStore = useUserStore()
const snackbar = useSnackbar()

const status = ref<BankStatus | null>(null)
const amount = ref<number | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)

const canSubmit = computed(() => Number.isFinite(amount.value) && Number(amount.value) > 0)

function formatMoney(value: number | undefined): string {
  return `${Math.floor(value ?? 0).toLocaleString('zh-CN')} G`
}

function formatDate(value: string | undefined): string {
  if (!value) return '尚未结算'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function syncProfile(nextStatus: BankStatus) {
  if (!userStore.profile) return
  userStore.profile = {
    ...userStore.profile,
    money: nextStatus.cash,
    bankDeposit: nextStatus.deposit,
  }
}

async function loadBankStatus() {
  isLoading.value = true
  try {
    const nextStatus = await httpChatApi.fetchBankStatus()
    status.value = nextStatus
    syncProfile(nextStatus)
  } catch (err: any) {
    snackbar.error(err.message || '银行信息加载失败')
  } finally {
    isLoading.value = false
  }
}

async function transfer(kind: 'deposit' | 'withdraw') {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const payload = { amount: Math.floor(Number(amount.value)) }
    const nextStatus = kind === 'deposit'
      ? await httpChatApi.depositBank(payload)
      : await httpChatApi.withdrawBank(payload)
    status.value = nextStatus
    syncProfile(nextStatus)
    amount.value = null
    snackbar.success(kind === 'deposit' ? '存入成功' : '提取成功')
  } catch (err: any) {
    snackbar.error(err.message || (kind === 'deposit' ? '存入失败' : '提取失败'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadBankStatus)
</script>

<template>
  <div class="bank-panel">
    <div class="app-stat-grid">
      <div class="app-stat-card">
        <span class="app-stat-label">余额</span>
        <strong class="app-stat-value">{{ formatMoney(status?.cash) }}</strong>
      </div>
      <div class="app-stat-card">
        <span class="app-stat-label">总资产</span>
        <strong class="app-stat-value">{{ formatMoney(status?.totalAssets) }}</strong>
      </div>
    </div>

    <div class="deposit-band app-stat-card app-stat-card-strong">
      <div>
        <span class="app-stat-label">存款</span>
        <strong class="app-stat-value">{{ formatMoney(status?.deposit) }}</strong>
      </div>
      <div class="interest-note">
        UTC 00:00 +1.2%
      </div>
    </div>

    <div class="bank-meta app-meta-list">
      <span>待结算在线时长 {{ Math.floor(status?.pendingPassiveMinutes ?? 0) }}/30 分钟</span>
      <span>上次利息 {{ formatDate(status?.lastInterestSettledAt) }}</span>
    </div>

    <div class="app-action-row app-action-row-three transfer-row">
      <div class="mdui-textfield app-field amount-field">
        <i class="mdui-icon material-icons mdui-textfield-icon">attach_money</i>
        <input
          v-model.number="amount"
          class="mdui-textfield-input"
          type="number"
          min="1"
          step="1"
          placeholder="金额"
          :disabled="isLoading || isSubmitting"
        />
      </div>
      <button
        class="mdui-btn mdui-btn-raised mdui-ripple app-button app-button-success"
        :disabled="!canSubmit || isSubmitting"
        @click="transfer('deposit')"
      >
        <i class="mdui-icon material-icons">call_made</i>
        存入
      </button>
      <button
        class="mdui-btn mdui-btn-raised mdui-ripple app-button"
        :disabled="!canSubmit || isSubmitting"
        @click="transfer('withdraw')"
      >
        <i class="mdui-icon material-icons">call_received</i>
        提取
      </button>
    </div>
  </div>
</template>

<style scoped>
.bank-panel {
  width: min(440px, calc(100vw - 56px));
  padding: 16px;
  color: var(--app-text-soft);
}

.deposit-band {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.interest-note {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--app-text-muted);
}

.bank-meta {
  margin: 12px 0 4px;
}

.transfer-row {
  margin-top: 4px;
}

.amount-field {
  padding-top: 0;
}

@media (max-width: 560px) {
  .deposit-band {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
