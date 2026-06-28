<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { httpChatApi } from '../../api/httpChatApi'
import { useSnackbar } from '../../composables/useSnackbar'
import { useUserStore } from '../../stores/useUserStore'
import type { StockStatus } from '../../types/stockTypes'

const BUY_TAX_RATE = 0.015
const SELL_TAX_RATE = 0.005

const userStore = useUserStore()
const snackbar = useSnackbar()

const status = ref<StockStatus | null>(null)
const sharesText = ref<string | number>('')
const autoBuyText = ref<string | number>('')
const autoSellText = ref<string | number>('')
const isLoading = ref(false)
const isSubmitting = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const parsedShares = computed(() => {
  const value = toInputText(sharesText.value)
  if (!/^\d+$/.test(value)) return null
  return Number(value)
})
const hasValidShares = computed(() => parsedShares.value !== null && parsedShares.value >= 1)
const canTrade = computed(() => hasValidShares.value && !isSubmitting.value)
const buyPreview = computed(() => {
  if (!status.value || parsedShares.value === null) return 0
  return Math.ceil(status.value.price * parsedShares.value * (1 + BUY_TAX_RATE))
})
const sellPreview = computed(() => {
  if (!status.value || parsedShares.value === null) return 0
  return Math.floor(status.value.price * parsedShares.value * (1 - SELL_TAX_RATE))
})

function formatMoney(value: number | undefined): string {
  return `${Math.floor(value ?? 0).toLocaleString('zh-CN')} G`
}

function formatPrice(value: number | undefined): string {
  return `${Number(value ?? 0).toFixed(4)} G`
}

function formatDate(value: string | undefined): string {
  if (!value) return '尚未更新'
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function toInputText(value: string | number | null | undefined): string {
  return String(value ?? '').trim()
}

function syncProfile(nextStatus: StockStatus) {
  if (!userStore.profile) return
  userStore.profile = {
    ...userStore.profile,
    money: nextStatus.user.cash,
    stockShares: nextStatus.user.shares,
    stockAutoBuyPrice: nextStatus.user.autoBuyPrice,
    stockAutoSellPrice: nextStatus.user.autoSellPrice,
  }
}

function syncForm(nextStatus: StockStatus) {
  autoBuyText.value = nextStatus.user.autoBuyPrice?.toString() ?? ''
  autoSellText.value = nextStatus.user.autoSellPrice?.toString() ?? ''
}

async function refreshTextFields() {
  await nextTick()
  mdui.mutation()
  mdui.updateTextFields?.()
}

async function loadStock({ silent = false } = {}) {
  if (!silent) isLoading.value = true
  try {
    const nextStatus = await httpChatApi.fetchStockStatus()
    status.value = nextStatus
    syncProfile(nextStatus)
    if (!autoBuyText.value && !autoSellText.value) syncForm(nextStatus)
    await refreshTextFields()
  } catch (err: any) {
    if (!silent) snackbar.error(err.message || '股票信息加载失败')
  } finally {
    if (!silent) isLoading.value = false
  }
}

async function trade(kind: 'buy' | 'sell') {
  if (isSubmitting.value) return
  if (parsedShares.value === null) {
    snackbar.error('股数需要是大于等于 1 的整数')
    return
  }
  isSubmitting.value = true
  try {
    const result = kind === 'buy'
      ? await httpChatApi.buyStock({ shares: parsedShares.value })
      : await httpChatApi.sellStock({ shares: parsedShares.value })
    status.value = result
    syncProfile(result)
    sharesText.value = ''
    snackbar.success(kind === 'buy'
      ? `买入 ${result.trade.shares} 股，花费 ${formatMoney(result.trade.total)}`
      : `卖出 ${result.trade.shares} 股，获得 ${formatMoney(result.trade.total)}`)
  } catch (err: any) {
    snackbar.error(err.message || (kind === 'buy' ? '买入失败' : '卖出失败'))
    await loadStock({ silent: true })
  } finally {
    isSubmitting.value = false
  }
}

function parseOptionalPrice(value: string | number): number | null {
  const text = toInputText(value)
  if (!text) return null
  const price = Number(text)
  if (!Number.isFinite(price) || price <= 0) return null
  return Number(price.toFixed(4))
}

async function saveAutoPrices() {
  const autoBuyPrice = parseOptionalPrice(autoBuyText.value)
  const autoSellPrice = parseOptionalPrice(autoSellText.value)
  if (toInputText(autoBuyText.value) && autoBuyPrice === null) {
    snackbar.error('自动买入价需要是大于 0 的数字')
    return
  }
  if (toInputText(autoSellText.value) && autoSellPrice === null) {
    snackbar.error('自动卖出价需要是大于 0 的数字')
    return
  }

  isSubmitting.value = true
  try {
    const nextStatus = await httpChatApi.setStockAutoPrices({ autoBuyPrice, autoSellPrice })
    status.value = nextStatus
    syncProfile(nextStatus)
    syncForm(nextStatus)
    await refreshTextFields()
    snackbar.success('自动交易价格已保存')
  } catch (err: any) {
    snackbar.error(err.message || '自动价格设置失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadStock()
  refreshTextFields()
  refreshTimer = setInterval(() => loadStock({ silent: true }), 60_000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<template>
  <div class="stock-panel mdui-p-a-2 mdui-text-color-blue-grey-900">
    <div class="stock-header mdui-valign">
      <div class="stock-title">
        <span class="metric-label mdui-typo-caption mdui-text-color-blue-grey-500">
          {{ status?.symbol ?? 'NEPH' }}
        </span>
        <strong class="stock-name mdui-text-truncate">{{ status?.name ?? '肾股' }}</strong>
      </div>
      <div
        class="mdui-chip stock-badge"
        :class="{
          'mdui-color-red-700': status?.isCrashed,
          'mdui-color-green-700': status?.isBull,
          'mdui-color-blue-grey-600': !status?.isCrashed && !status?.isBull,
        }"
      >
        <span class="mdui-chip-icon">
          <i class="mdui-icon material-icons">
            {{ status?.isCrashed ? 'trending_down' : status?.isBull ? 'trending_up' : 'show_chart' }}
          </i>
        </span>
        <span class="mdui-chip-title">
          {{ status?.isCrashed ? '已崩盘' : status?.isBull ? '牛股' : '交易中' }}
        </span>
      </div>
    </div>

    <div class="stock-grid">
      <div class="stock-metric mdui-color-blue-grey-50 mdui-p-a-1">
        <span class="metric-label mdui-typo-caption mdui-text-color-blue-grey-500">当前股价</span>
        <strong class="metric-value">{{ formatPrice(status?.price) }}</strong>
      </div>
      <div class="stock-metric mdui-color-blue-grey-50 mdui-p-a-1">
        <span class="metric-label mdui-typo-caption mdui-text-color-blue-grey-500">持股数</span>
        <strong class="metric-value">{{ status?.user.shares ?? 0 }}</strong>
      </div>
      <div class="stock-metric mdui-color-blue-grey-50 mdui-p-a-1">
        <span class="metric-label mdui-typo-caption mdui-text-color-blue-grey-500">买入价</span>
        <strong class="metric-value">{{ formatPrice(status?.buyPrice) }}</strong>
      </div>
      <div class="stock-metric mdui-color-blue-grey-50 mdui-p-a-1">
        <span class="metric-label mdui-typo-caption mdui-text-color-blue-grey-500">卖出价</span>
        <strong class="metric-value">{{ formatPrice(status?.sellPrice) }}</strong>
      </div>
    </div>

    <div class="stock-meta mdui-typo-caption mdui-text-color-blue-grey-900">
      <span class="mdui-valign">
        <i class="mdui-icon material-icons">account_balance_wallet</i>
        余额 {{ formatMoney(status?.user.cash) }}
      </span>
      <span class="mdui-valign">
        <i class="mdui-icon material-icons">update</i>
        更新 {{ formatDate(status?.updatedAt) }}
      </span>
      <span class="mdui-valign">
        买税 1.5% / 卖税 0.5%
      </span>
      <span class="mdui-valign">
        买入将花费 {{ formatMoney(buyPreview) }}
      </span>
      <span class="mdui-valign">
        卖出将获得 {{ formatMoney(sellPreview) }}
      </span>
    </div>

    <div class="trade-row">
      <div class="mdui-textfield mdui-textfield-floating-label amount-field">
        <i class="mdui-icon material-icons mdui-textfield-icon">confirmation_number</i>
        <label class="mdui-textfield-label">股数</label>
        <input
          v-model="sharesText"
          class="mdui-textfield-input"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          :disabled="isSubmitting"
        />
      </div>
      <div class="trade-actions">
        <button
          class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-brown-600 action-btn"
          type="button"
          :disabled="isSubmitting"
          @click.prevent="trade('sell')"
        >
          <i class="mdui-icon material-icons mdui-icon-left">call_received</i>
          卖出
        </button>
        <button
          class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-green-700 action-btn"
          type="button"
          :disabled="isSubmitting || status?.isCrashed === true"
          @click.prevent="trade('buy')"
        >
          <i class="mdui-icon material-icons mdui-icon-left">call_made</i>
          买入
        </button>
      </div>
    </div>

    <div class="auto-row">
      <div class="mdui-textfield mdui-textfield-floating-label amount-field">
        <i class="mdui-icon material-icons mdui-textfield-icon">attach_money</i>
        <label class="mdui-textfield-label">自动买入价</label>
        <input
          v-model="autoBuyText"
          class="mdui-textfield-input"
          type="number"
          min="0"
          step="0.0001"
          :disabled="isSubmitting"
        />
      </div>
      <div class="mdui-textfield mdui-textfield-floating-label amount-field">
        <i class="mdui-icon material-icons mdui-textfield-icon">attach_money</i>
        <label class="mdui-textfield-label">自动卖出价</label>
        <input
          v-model="autoSellText"
          class="mdui-textfield-input"
          type="number"
          min="0"
          step="0.0001"
          :disabled="isSubmitting"
        />
      </div>
      <button
        class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-blue-grey-600 action-btn"
        type="button"
        :disabled="isSubmitting"
        @click.prevent="saveAutoPrices"
      >
        <i class="mdui-icon material-icons mdui-icon-left">save</i>
        保存
      </button>
    </div>
  </div>
</template>

<style scoped>
.stock-panel {
  width: min(480px, calc(100vw - 56px));
  box-sizing: border-box;
}

.stock-header {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.stock-title {
  min-width: 0;
}

.metric-label {
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.stock-name,
.metric-value {
  display: block;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 600;
  color: #263238;
}

.stock-name {
  max-width: 280px;
}

.stock-badge {
  flex: 0 0 auto;
  color: #fff;
}

.stock-badge .mdui-chip-icon {
  background: rgba(255, 255, 255, 0.2);
}

.stock-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stock-metric {
  border: 1px solid #d9e1e5;
  border-radius: 4px;
  min-width: 0;
}

.stock-meta,
.trade-preview {
  display: grid;
  gap: 4px;
  margin: 12px 0 4px;
  font-size: 12px;
}

.trade-preview {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 8px;
}

.stock-meta .mdui-icon,
.trade-preview .mdui-icon {
  margin-right: 6px;
  font-size: 16px;
}

.trade-row {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) auto;
  align-items: end;
  column-gap: 12px;
  margin-top: 4px;
}

.trade-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0;
}

.auto-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) auto;
  align-items: end;
  column-gap: 16px;
  margin-top: 18px;
}

.amount-field {
  min-width: 0;
  margin: 0;
  padding-top: 8px;
  width: 100%;
}

.amount-field .mdui-textfield-icon {
  overflow: hidden;
  width: 24px;
  pointer-events: none;
}

.action-btn {
  min-width: 76px;
  height: 36px;
  line-height: 36px;
  color: #fff;
}

.mdui-btn[disabled] {
  color: rgba(0, 0, 0, 0.26);
  background: rgba(0, 0, 0, 0.12);
}

@media (max-width: 560px) {
  .stock-grid,
  .trade-row,
  .trade-preview,
  .auto-row {
    grid-template-columns: 1fr;
  }

  .trade-actions {
    justify-content: stretch;
  }

  .trade-actions .action-btn {
    flex: 1 1 0;
  }

  .stock-header {
    align-items: flex-start;
  }
}
</style>
