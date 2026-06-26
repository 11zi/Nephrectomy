<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { httpChatApi } from '../../api/httpChatApi'
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
    await nextTick()
    amountInput.value?.focus()
  }
}

onMounted(loadBalance)
</script>

<template>
  <div class="dice-panel">
    <div class="balance-band">
      <span class="metric-label">当前余额</span>
      <strong>{{ formatMoney(currentBalance) }}</strong>
    </div>

    <div class="dice-copy">
      <i class="mdui-icon material-icons">casino</i>
      <span>50% 概率获得下注额 1 倍，失败则失去下注额。</span>
    </div>

    <form class="dice-form" @submit.prevent="rollDice">
      <div
        class="mdui-textfield amount-field"
        :class="{ 'mdui-textfield-invalid': validationMessage }"
      >
        <i class="mdui-icon material-icons mdui-textfield-icon">attach_money</i>
        <input
          ref="amountInput"
          v-model.trim="amountText"
          class="mdui-textfield-input"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          placeholder="下注金额"
          :disabled="isLoading || isSubmitting"
        />
        <div class="mdui-textfield-error">{{ validationMessage }}</div>
      </div>

      <button
        class="mdui-btn mdui-btn-raised mdui-ripple"
        type="submit"
        :disabled="!canSubmit"
      >
        <i class="mdui-icon material-icons">check</i>
        确定
      </button>
    </form>
  </div>
</template>

<style scoped>
.dice-panel {
  width: min(360px, calc(100vw - 56px));
  padding: 16px;
  color: #37474f;
}

.balance-band {
  border: 1px solid #d9e1e5;
  border-radius: 8px;
  padding: 14px;
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
  font-size: 26px;
  line-height: 1.2;
  font-weight: 600;
  color: #263238;
}

.dice-copy {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 4px;
  font-size: 13px;
  line-height: 1.4;
  color: #607d8b;
}

.dice-form {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) auto;
  align-items: end;
  gap: 8px;
}

.amount-field {
  padding-top: 0;
}

.mdui-btn {
  min-width: 86px;
  color: #fff;
  background: #546e7a;
}

.mdui-btn[disabled] {
  color: rgba(0, 0, 0, 0.26);
  background: rgba(0, 0, 0, 0.12);
}

@media (max-width: 480px) {
  .dice-form {
    grid-template-columns: 1fr;
  }
}
</style>
