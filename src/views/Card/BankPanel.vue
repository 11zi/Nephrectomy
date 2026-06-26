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
    <div class="bank-balance-row">
      <div class="bank-metric">
        <span class="metric-label">余额</span>
        <strong>{{ formatMoney(status?.cash) }}</strong>
      </div>
      <div class="bank-metric">
        <span class="metric-label">总资产</span>
        <strong>{{ formatMoney(status?.totalAssets) }}</strong>
      </div>
    </div>

    <div class="deposit-band">
      <div>
        <span class="metric-label">存款</span>
        <strong>{{ formatMoney(status?.deposit) }}</strong>
      </div>
      <div class="interest-note">
        UTC 00:00 +1.2%
      </div>
    </div>

    <div class="bank-meta">
      <span>待结算在线时长 {{ Math.floor(status?.pendingPassiveMinutes ?? 0) }}/30 分钟</span>
      <span>上次利息 {{ formatDate(status?.lastInterestSettledAt) }}</span>
    </div>

    <div class="transfer-row">
      <div class="mdui-textfield amount-field">
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
        class="mdui-btn mdui-btn-raised mdui-ripple"
        :disabled="!canSubmit || isSubmitting"
        @click="transfer('deposit')"
      >
        <i class="mdui-icon material-icons">call_made</i>
        存入
      </button>
      <button
        class="mdui-btn mdui-btn-raised mdui-ripple"
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
  color: #37474f;
}

.bank-balance-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bank-metric,
.deposit-band {
  border: 1px solid #d9e1e5;
  border-radius: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.82);
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #78909c;
  margin-bottom: 4px;
}

strong {
  display: block;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 600;
  color: #263238;
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
  color: #607d8b;
}

.bank-meta {
  display: grid;
  gap: 4px;
  margin: 12px 0 4px;
  font-size: 12px;
  color: #78909c;
}

.transfer-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto auto;
  align-items: end;
  gap: 8px;
}

.amount-field {
  padding-top: 0;
}

.mdui-btn {
  min-width: 78px;
  color: #fff;
  background: #546e7a;
}

.mdui-btn[disabled] {
  color: rgba(0, 0, 0, 0.26);
  background: rgba(0, 0, 0, 0.12);
}

@media (max-width: 560px) {
  .bank-balance-row,
  .transfer-row {
    grid-template-columns: 1fr;
  }

  .deposit-band {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
