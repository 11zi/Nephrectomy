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
const sharesText = ref('')
const autoBuyText = ref('')
const autoSellText = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const parsedShares = computed(() => {
  if (!/^\d+$/.test(sharesText.value.trim())) return null
  return Number(sharesText.value)
})
const hasValidShares = computed(() => parsedShares.value !== null && parsedShares.value >= 1)
const canTrade = computed(() => status.value !== null && hasValidShares.value && !isSubmitting.value)
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
  if (!canTrade.value || parsedShares.value === null) return
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

function parseOptionalPrice(value: string): number | null {
  if (!value.trim()) return null
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return null
  return Number(price.toFixed(4))
}

async function saveAutoPrices() {
  const autoBuyPrice = parseOptionalPrice(autoBuyText.value)
  const autoSellPrice = parseOptionalPrice(autoSellText.value)
  if (autoBuyText.value.trim() && autoBuyPrice === null) {
    snackbar.error('自动买入价需要是大于 0 的数字')
    return
  }
  if (autoSellText.value.trim() && autoSellPrice === null) {
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
  <div class="stock-panel">
    <div class="stock-header">
      <div>
        <span class="metric-label">{{ status?.symbol ?? 'NEPH' }}</span>
        <strong>{{ status?.name ?? '肾股' }}</strong>
      </div>
      <span
        class="stock-badge"
        :class="{ crashed: status?.isCrashed, bull: status?.isBull }"
      >
        {{ status?.isCrashed ? '已崩盘' : status?.isBull ? '牛股' : '交易中' }}
      </span>
    </div>

    <div class="stock-grid">
      <div class="stock-metric">
        <span class="metric-label">当前股价</span>
        <strong>{{ formatPrice(status?.price) }}</strong>
      </div>
      <div class="stock-metric">
        <span class="metric-label">持股数</span>
        <strong>{{ status?.user.shares ?? 0 }}</strong>
      </div>
      <div class="stock-metric">
        <span class="metric-label">买入价</span>
        <strong>{{ formatPrice(status?.buyPrice) }}</strong>
      </div>
      <div class="stock-metric">
        <span class="metric-label">卖出价</span>
        <strong>{{ formatPrice(status?.sellPrice) }}</strong>
      </div>
    </div>

    <div class="stock-meta">
      <span>余额 {{ formatMoney(status?.user.cash) }}</span>
      <span>更新 {{ formatDate(status?.updatedAt) }}</span>
      <span>买税 1.5% / 卖税 0.5%</span>
    </div>

    <form class="trade-row" @submit.prevent="trade('buy')">
      <div class="mdui-textfield amount-field">
        <input
          v-model.trim="sharesText"
          class="mdui-textfield-input"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          placeholder="股数"
          :disabled="isSubmitting"
        />
      </div>
      <button
        class="mdui-btn mdui-btn-raised mdui-ripple buy-btn"
        type="submit"
        :disabled="!canTrade || status?.isCrashed"
      >
        买入
      </button>
      <button
        class="mdui-btn mdui-btn-raised mdui-ripple sell-btn"
        type="button"
        :disabled="!canTrade"
        @click="trade('sell')"
      >
        卖出
      </button>
    </form>

    <div class="trade-preview">
      <span>买入将花费 {{ formatMoney(buyPreview) }}</span>
      <span>卖出将获得 {{ formatMoney(sellPreview) }}</span>
    </div>

    <form class="auto-row" @submit.prevent="saveAutoPrices">
      <div class="mdui-textfield amount-field">
        <input
          v-model.trim="autoBuyText"
          class="mdui-textfield-input"
          type="number"
          min="0"
          step="0.0001"
          placeholder="自动买入价"
          :disabled="isSubmitting"
        />
      </div>
      <div class="mdui-textfield amount-field">
        <input
          v-model.trim="autoSellText"
          class="mdui-textfield-input"
          type="number"
          min="0"
          step="0.0001"
          placeholder="自动卖出价"
          :disabled="isSubmitting"
        />
      </div>
      <button
        class="mdui-btn mdui-btn-raised mdui-ripple auto-btn"
        type="submit"
        :disabled="isSubmitting"
      >
        保存
      </button>
    </form>
  </div>
</template>

<style scoped>
.stock-panel {
  width: min(480px, calc(100vw - 56px));
  padding: 16px;
  color: #37474f;
}

.stock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
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

.stock-badge {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 4px 10px;
  color: #fff;
  background: #607d8b;
  font-size: 12px;
}

.stock-badge.bull {
  background: #2e7d32;
}

.stock-badge.crashed {
  background: #b71c1c;
}

.stock-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stock-metric {
  border: 1px solid #d9e1e5;
  border-radius: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.82);
}

.stock-meta,
.trade-preview {
  display: grid;
  gap: 4px;
  margin: 12px 0 4px;
  font-size: 12px;
  color: #78909c;
}

.trade-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto auto;
  align-items: end;
  gap: 8px;
}

.auto-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) auto;
  align-items: end;
  gap: 8px;
  margin-top: 8px;
}

.amount-field {
  padding-top: 0;
}

.mdui-btn {
  min-width: 72px;
  height: 36px;
  line-height: 36px;
  color: #fff;
  background: #546e7a;
}

.buy-btn {
  background: #2e7d32;
}

.sell-btn {
  background: #8a4b2a;
}

.auto-btn {
  background: #546e7a;
}

.mdui-btn[disabled] {
  color: rgba(0, 0, 0, 0.26);
  background: rgba(0, 0, 0, 0.12);
}

@media (max-width: 560px) {
  .stock-grid,
  .trade-row,
  .auto-row {
    grid-template-columns: 1fr;
  }
}
</style>
