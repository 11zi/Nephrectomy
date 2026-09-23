<script setup lang="ts">
import { computed, ref } from 'vue'
import { DoorOpen, X } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { useContentStore } from '../../stores/useContentStore'
import { useRoomStore } from '../../stores/useRoomStore'
import { useUserStore } from '../../stores/useUserStore'
import { useSnackbar } from '../../composables/useSnackbar'

const contentStore = useContentStore()
const roomStore = useRoomStore()
const userStore = useUserStore()
const snackbar = useSnackbar()

const name = ref('')
const description = ref('')
const isBuying = ref(false)

const cash = computed(() => userStore.profile?.money ?? 0)
const canAfford = computed(() => cash.value >= 300_000)

function formatMoney(value: number): string {
  return Math.floor(value).toLocaleString('zh-CN')
}

async function buyRoom() {
  isBuying.value = true
  try {
    const result = await roomStore.buyRoom({
      name: name.value,
      description: description.value,
    })
    await userStore.loadProfile()
    contentStore.navigateToRoomInfo(result.room.id)
    snackbar.show('购买成功，房间已创建')
  } catch (err) {
    snackbar.show(err instanceof Error ? err.message : '购买失败')
  } finally {
    isBuying.value = false
  }
}
</script>

<template>
  <div class="app-page shop-page">
    <div class="app-page-header app-page-header-bordered">
      <Button
        class="app-header-icon-button"
        variant="ghost"
        size="icon"
        type="button"
        @click="contentStore.navigateTo('chat')"
        title="返回聊天室"
      >
        <X />
      </Button>
      <div class="app-page-title">
        <span>商城</span>
      </div>
    </div>

    <div class="shop-body">
      <section class="shop-item">
        <div class="shop-item-main">
          <div class="shop-item-icon">
            <DoorOpen />
          </div>
          <div>
            <h1>房间</h1>
            <p>创建一个属于你的房间。首付 30 万，剩余 70 万贷款可在房间信息里慢慢还。</p>
          </div>
        </div>

        <div class="shop-price">
          <div>
            <span>首付</span>
            <strong>{{ formatMoney(300000) }}</strong>
          </div>
          <div>
            <span>贷款</span>
            <strong>{{ formatMoney(700000) }}</strong>
          </div>
          <div>
            <span>现金</span>
            <strong>{{ formatMoney(cash) }}</strong>
          </div>
        </div>

        <form class="shop-form" @submit.prevent="buyRoom">
          <label class="shop-field">
            <span>房间名</span>
            <Input v-model="name" maxlength="24" placeholder="默认使用昵称生成" />
          </label>
          <label class="shop-field">
            <span>简介</span>
            <Textarea v-model="description" maxlength="100" rows="3" />
          </label>
          <Button
            type="submit"
            :disabled="isBuying || !canAfford"
          >
            购买房间
          </Button>
          <p v-if="!canAfford" class="shop-note">现金不足，需要 30 万首付。</p>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.shop-page {
  background: var(--app-bg-soft);
}

.shop-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.shop-item {
  background: var(--app-surface);
  border: 1px solid var(--app-border-soft);
  border-radius: 8px;
  padding: 16px;
  max-width: 720px;
}

.shop-item-main {
  display: flex;
  gap: 14px;
}

.shop-item-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #e0f2f1;
  color: #00695c;
  display: grid;
  place-items: center;
}

.shop-item-icon svg {
  width: 24px;
  height: 24px;
}

.shop-item h1 {
  margin: 0;
  font-size: 22px;
}

.shop-item p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.shop-price {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.shop-price > div {
  border: 1px solid var(--app-border-soft);
  border-radius: 8px;
  padding: 10px;
}

.shop-price span {
  display: block;
  color: var(--app-text-muted);
  font-size: 12px;
}

.shop-price strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
}

.shop-form {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.shop-field {
  display: grid;
  gap: 6px;
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.shop-note {
  color: #c62828;
  margin: 10px 0 0;
}

@media (max-width: 600px) {
  .shop-price {
    grid-template-columns: 1fr;
  }
}
</style>
