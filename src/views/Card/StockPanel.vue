<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  ChartLine,
  RefreshCw,
  Save,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-vue-next'
import { httpChatApi } from '../../api/httpChatApi'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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

async function loadStock({ silent = false } = {}) {
  if (!silent) isLoading.value = true
  try {
    const nextStatus = await httpChatApi.fetchStockStatus()
    status.value = nextStatus
    syncProfile(nextStatus)
    if (!autoBuyText.value && !autoSellText.value) syncForm(nextStatus)
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
    snackbar.success('自动交易价格已保存')
  } catch (err: any) {
    snackbar.error(err.message || '自动价格设置失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadStock()
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
      <div class="stock-title">
        <span class="app-stat-label">
          {{ status?.symbol ?? 'NEPH' }}
        </span>
        <strong class="app-stat-value stock-name">{{ status?.name ?? '肾股' }}</strong>
      </div>
      <Badge
        class="stock-badge"
        :variant="status?.isCrashed ? 'destructive' : status?.isBull ? 'default' : 'secondary'"
      >
        <TrendingDown v-if="status?.isCrashed" />
        <TrendingUp v-else-if="status?.isBull" />
        <ChartLine v-else />
        {{ status?.isCrashed ? '已崩盘' : status?.isBull ? '牛股' : '交易中' }}
      </Badge>
    </div>

    <div class="app-stat-grid">
      <div class="app-stat-card">
        <span class="app-stat-label">当前股价</span>
        <strong class="app-stat-value">{{ formatPrice(status?.price) }}</strong>
      </div>
      <div class="app-stat-card">
        <span class="app-stat-label">持股数</span>
        <strong class="app-stat-value">{{ status?.user.shares ?? 0 }}</strong>
      </div>
      <div class="app-stat-card">
        <span class="app-stat-label">买入价</span>
        <strong class="app-stat-value">{{ formatPrice(status?.buyPrice) }}</strong>
      </div>
      <div class="app-stat-card">
        <span class="app-stat-label">卖出价</span>
        <strong class="app-stat-value">{{ formatPrice(status?.sellPrice) }}</strong>
      </div>
    </div>

    <div class="stock-meta app-meta-list">
      <span class="app-meta-line">
        <Wallet class="stock-meta-icon" />
        余额 {{ formatMoney(status?.user.cash) }}
      </span>
      <span class="app-meta-line">
        <RefreshCw class="stock-meta-icon" />
        更新 {{ formatDate(status?.updatedAt) }}
      </span>
      <span class="app-meta-line">
        买税 1.5% / 卖税 0.5%
      </span>
      <span class="app-meta-line">
        买入将花费 {{ formatMoney(buyPreview) }}
      </span>
      <span class="app-meta-line">
        卖出将获得 {{ formatMoney(sellPreview) }}
      </span>
    </div>

    <div class="app-action-row app-action-row-two trade-row">
      <label class="amount-field">
        <span class="amount-label">
          <BadgeDollarSign class="amount-label-icon" />
          股数
        </span>
        <Input
          v-model="sharesText"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          :disabled="isSubmitting"
        />
      </label>
      <div class="trade-actions">
        <Button
          class="app-button app-button-danger action-btn"
          type="button"
          :disabled="isSubmitting"
          @click.prevent="trade('sell')"
        >
          <ArrowDownToLine />
          卖出
        </Button>
        <Button
          class="app-button app-button-success action-btn"
          type="button"
          :disabled="isSubmitting || status?.isCrashed === true"
          @click.prevent="trade('buy')"
        >
          <ArrowUpFromLine />
          买入
        </Button>
      </div>
    </div>

    <div class="app-action-row app-action-row-auto auto-row">
      <label class="amount-field">
        <span class="amount-label">自动买入价</span>
        <Input
          v-model="autoBuyText"
          type="number"
          min="0"
          step="0.0001"
          :disabled="isSubmitting"
        />
      </label>
      <label class="amount-field">
        <span class="amount-label">自动卖出价</span>
        <Input
          v-model="autoSellText"
          type="number"
          min="0"
          step="0.0001"
          :disabled="isSubmitting"
        />
      </label>
      <Button
        class="app-button action-btn"
        type="button"
        :disabled="isSubmitting"
        @click.prevent="saveAutoPrices"
      >
        <Save />
        保存
      </Button>
    </div>
  </div>
</template>

<style scoped>
.stock-panel {
  width: min(480px, calc(100vw - 56px));
  box-sizing: border-box;
  padding: 16px;
  color: var(--app-text-soft);
}

.stock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.stock-title {
  min-width: 0;
}

.stock-name {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-badge {
  flex: 0 0 auto;
  gap: 6px;
}

.stock-meta,
.trade-preview {
  margin: 12px 0 4px;
}

.trade-preview {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 8px;
}

.stock-meta-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.trade-row {
  margin-top: 4px;
}

.trade-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0;
}

.auto-row {
  margin-top: 18px;
}

.amount-field {
  display: grid;
  gap: 6px;
  margin: 0;
  min-width: 0;
}

.amount-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.amount-label-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.action-btn {
  min-width: 76px;
}

@media (max-width: 560px) {
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
