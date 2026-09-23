<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BadgePercent, Check, CircleMinus, Hourglass, Landmark, ReceiptText } from 'lucide-vue-next'
import { httpChatApi } from '../../api/httpChatApi'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useSnackbar } from '../../composables/useSnackbar'
import { useUserStore } from '../../stores/useUserStore'
import type { BankStatus } from '../../types/bankTypes'

const userStore = useUserStore()
const snackbar = useSnackbar()

const status = ref<BankStatus | null>(null)
const amountText = ref('')
const amountInput = ref<HTMLInputElement | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)

const currentBalance = computed(() => status.value?.cash ?? userStore.profile?.money ?? 0)
const parsedAmount = computed(() => {
  if (!/^\d+$/.test(amountText.value.trim())) return null
  return Number(amountText.value)
})
const validationMessage = computed(() => {
  if (!amountText.value.trim()) return ''
  if (parsedAmount.value === null) return '请输入整数'
  if (parsedAmount.value < 1) return '金额至少为 1'
  if (parsedAmount.value >= currentBalance.value) return '金额必须小于当前余额'
  return ''
})
const canSubmit = computed(() => (
  !isLoading.value
  && !isSubmitting.value
  && parsedAmount.value !== null
  && parsedAmount.value >= 1
  && parsedAmount.value < currentBalance.value
))

function formatMoney(value: number | undefined): string {
  return `${Math.floor(value ?? 0).toLocaleString('zh-CN')} G`
}

function syncProfile(nextStatus: BankStatus) {
  if (!userStore.profile) return
  userStore.profile = {
    ...userStore.profile,
    money: nextStatus.cash,
    bankDeposit: nextStatus.deposit,
  }
}

async function loadBalance() {
  isLoading.value = true
  try {
    const nextStatus = await httpChatApi.fetchBankStatus()
    status.value = nextStatus
    syncProfile(nextStatus)
  } catch (err: any) {
    snackbar.error(err.message || '余额加载失败')
  } finally {
    isLoading.value = false
  }
}

async function rollDice() {
  if (!canSubmit.value || parsedAmount.value === null) return
  isSubmitting.value = true
  try {
    const result = await httpChatApi.rollDice({ amount: parsedAmount.value })
    status.value = result
    syncProfile(result)
    amountText.value = ''

    if (result.dice.won) {
      snackbar.success(`骰子成功，获得 ${formatMoney(result.dice.delta)}`)
    } else {
      snackbar.error(`骰子失败，失去 ${formatMoney(Math.abs(result.dice.delta))}`)
    }
  } catch (err: any) {
    snackbar.error(err.message || '骰子结算失败')
    await loadBalance()
  } finally {
    isSubmitting.value = false
    amountInput.value?.focus()
  }
}

onMounted(() => {
  loadBalance()
})
</script>

<template>
  <div class="dice-panel">
    <div class="dice-header">
      <div class="dice-title">
        <span class="app-stat-label">骰子游戏</span>
        <strong class="app-stat-value dice-title-value">下注试手气</strong>
      </div>
      <Badge class="dice-chip">
        <BadgePercent />
        50%
      </Badge>
    </div>

    <div class="app-stat-card app-stat-card-strong balance-band">
      <span class="app-stat-label">当前余额</span>
      <strong class="app-stat-value balance-value">{{ formatMoney(currentBalance) }}</strong>
    </div>

    <div class="dice-copy app-meta-list">
      <span class="app-meta-line">
        <ReceiptText class="dice-copy-icon" />
        成功获得下注额 1 倍
      </span>
      <span class="app-meta-line">
        <CircleMinus class="dice-copy-icon" />
        失败失去下注额
      </span>
    </div>

    <form class="app-action-row app-action-row-two dice-form" @submit.prevent="rollDice">
      <div class="amount-field">
        <label class="amount-label">
          <Landmark class="amount-label-icon" />
          下注金额
        </label>
        <Input
          ref="amountInput"
          v-model="amountText"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          :disabled="isLoading || isSubmitting"
        />
        <div v-if="validationMessage" class="amount-error">{{ validationMessage }}</div>
      </div>

      <Button
        class="app-button action-btn"
        type="submit"
        :disabled="!canSubmit"
      >
        <Hourglass v-if="isSubmitting" />
        <Check v-else />
        确定
      </Button>
    </form>
  </div>
</template>

<style scoped>
.dice-panel {
  width: min(360px, calc(100vw - 56px));
  box-sizing: border-box;
  padding: 16px;
  color: var(--app-text-soft);
}

.dice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.dice-title {
  min-width: 0;
}

.dice-title-value {
  font-size: 22px;
}

.balance-value {
  font-size: 26px;
}

.dice-chip {
  flex: 0 0 auto;
  gap: 6px;
}

.dice-copy {
  margin: 12px 0 4px;
  font-size: 13px;
}

.dice-form {
  margin-top: 4px;
}

.amount-field {
  min-width: 0;
}

.amount-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.amount-label-icon,
.dice-copy-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.amount-error {
  margin-top: 4px;
  color: #c62828;
  font-size: 12px;
}

.action-btn {
  min-width: 86px;
}

@media (max-width: 480px) {
  .dice-header {
    align-items: flex-start;
  }
}
</style>
