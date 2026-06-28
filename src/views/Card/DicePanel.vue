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
    await refreshTextFields()
  }
}

async function refreshTextFields() {
  await nextTick()
  mdui.mutation()
  mdui.updateTextFields?.()
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
    await refreshTextFields()
    amountInput.value?.focus()
  }
}

onMounted(() => {
  loadBalance()
  refreshTextFields()
})
</script>

<template>
  <div class="dice-panel mdui-p-a-2 mdui-text-color-blue-grey-900">
    <div class="dice-header mdui-valign mdui-m-b-1">
      <div class="dice-title">
        <span class="metric-label mdui-typo-caption mdui-text-color-blue-grey-500">骰子游戏</span>
        <strong class="panel-title">下注试手气</strong>
      </div>
      <div class="mdui-chip dice-chip mdui-color-blue-grey-600">
        <span class="mdui-chip-icon">
          <i class="mdui-icon material-icons">casino</i>
        </span>
        <span class="mdui-chip-title">50%</span>
      </div>
    </div>

    <div class="balance-band mdui-color-blue-grey-50 mdui-p-a-2">
      <span class="metric-label mdui-typo-caption mdui-text-color-blue-grey-500">当前余额</span>
      <strong class="balance-value">{{ formatMoney(currentBalance) }}</strong>
    </div>

    <div class="dice-copy mdui-typo-caption mdui-text-color-blue-grey-500">
      <span class="mdui-valign">
        <i class="mdui-icon material-icons">payments</i>
        成功获得下注额 1 倍
      </span>
      <span class="mdui-valign">
        <i class="mdui-icon material-icons">remove_circle_outline</i>
        失败失去下注额
      </span>
    </div>

    <form class="dice-form mdui-m-t-1" @submit.prevent="rollDice">
      <div
        class="mdui-textfield mdui-textfield-floating-label amount-field"
        :class="{ 'mdui-textfield-invalid': validationMessage }"
      >
        <i class="mdui-icon material-icons mdui-textfield-icon">attach_money</i>
        <label class="mdui-textfield-label">下注金额</label>
        <input
          ref="amountInput"
          v-model.trim="amountText"
          class="mdui-textfield-input"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          :disabled="isLoading || isSubmitting"
        />
        <div class="mdui-textfield-error">{{ validationMessage }}</div>
      </div>

      <button
        class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-blue-grey-600 action-btn"
        type="submit"
        :disabled="!canSubmit"
      >
        <i class="mdui-icon material-icons mdui-icon-left">
          {{ isSubmitting ? 'hourglass_empty' : 'check' }}
        </i>
        确定
      </button>
    </form>
  </div>
</template>

<style scoped>
.dice-panel {
  width: min(360px, calc(100vw - 56px));
  box-sizing: border-box;
}

.dice-header {
  justify-content: space-between;
  gap: 12px;
}

.dice-title {
  min-width: 0;
}

.balance-band {
  border: 1px solid #d9e1e5;
  border-radius: 4px;
  min-width: 0;
}

.metric-label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.panel-title,
.balance-value {
  display: block;
  line-height: 1.2;
  font-weight: 600;
  color: #263238;
}

.panel-title {
  font-size: 22px;
}

.balance-value {
  font-size: 26px;
}

.dice-chip {
  flex: 0 0 auto;
  color: #fff;
}

.dice-chip .mdui-chip-icon {
  background: rgba(255, 255, 255, 0.2);
}

.dice-copy {
  display: grid;
  gap: 4px;
  margin: 12px 0 4px;
  font-size: 13px;
  line-height: 1.4;
}

.dice-copy .mdui-icon {
  margin-right: 6px;
  font-size: 16px;
}

.dice-form {
  display: grid;
  grid-template-columns: minmax(140px, 1fr) auto;
  align-items: end;
  gap: 8px;
}

.amount-field {
  min-width: 0;
  padding-top: 0;
}

.action-btn {
  min-width: 86px;
  height: 36px;
  line-height: 36px;
  color: #fff;
}

.mdui-btn[disabled] {
  color: rgba(0, 0, 0, 0.26);
  background: rgba(0, 0, 0, 0.12);
}

@media (max-width: 480px) {
  .dice-form {
    grid-template-columns: 1fr;
  }

  .dice-header {
    align-items: flex-start;
  }
}
</style>
