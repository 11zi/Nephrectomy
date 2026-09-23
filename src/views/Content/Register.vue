<script setup lang="ts">
import { ref } from 'vue'
import { Hourglass, Lock, Mail, User, UserPlus } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useContentStore } from '../../stores/useContentStore'
import { useUserStore } from '../../stores/useUserStore'
import { useSnackbar } from '../../composables/useSnackbar'

const contentStore = useContentStore()
const userStore = useUserStore()
const snackbar = useSnackbar()

const nickname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const isSubmitting = ref(false)

function validate(): string | null {
  if (!nickname.value.trim()) return '请输入昵称'
  if (nickname.value.trim().length > 24) return '昵称不能超过 24 个字符'
  if (!email.value.trim()) return '请输入邮箱'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return '邮箱格式不正确'
  if (!password.value) return '请输入密码'
  if (password.value.length < 6) return '密码长度不能少于 6 位'
  if (password.value !== passwordConfirm.value) return '两次输入的密码不一致'
  return null
}

async function handleRegister() {
  const errMsg = validate()
  if (errMsg) {
    snackbar.error(errMsg)
    return
  }

  isSubmitting.value = true
  try {
    await userStore.register(email.value.trim(), password.value, nickname.value.trim())
    snackbar.success('注册成功！欢迎加入~')
    contentStore.navigateTo('chat')
  } catch (err: any) {
    snackbar.error(err.message || '注册失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

function goToLogin() {
  contentStore.navigateTo('login')
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="auth-title">注册</h2>
        <p class="auth-subtitle">创建账号，加入肾摘除聊天室</p>
      </div>

      <div class="auth-body">
        <label class="auth-field">
          <span class="auth-field-label">
            <User />
            昵称
          </span>
          <Input
            v-model="nickname"
            type="text"
            maxlength="24"
            @keydown.enter="handleRegister"
          />
        </label>

        <label class="auth-field">
          <span class="auth-field-label">
            <Mail />
            邮箱
          </span>
          <Input
            v-model="email"
            type="email"
            autocomplete="email"
            @keydown.enter="handleRegister"
          />
        </label>

        <label class="auth-field">
          <span class="auth-field-label">
            <Lock />
            密码（至少 6 位）
          </span>
          <Input
            v-model="password"
            type="password"
            autocomplete="new-password"
          />
        </label>

        <label class="auth-field">
          <span class="auth-field-label">
            <Lock />
            确认密码
          </span>
          <Input
            v-model="passwordConfirm"
            type="password"
            autocomplete="new-password"
            @keydown.enter="handleRegister"
          />
        </label>

        <Button
          class="auth-btn"
          :disabled="isSubmitting"
          @click="handleRegister"
        >
          <span class="auth-btn-content">
            <Hourglass v-if="isSubmitting" />
            <UserPlus v-else />
            <span>{{ isSubmitting ? '注册中…' : '注册' }}</span>
          </span>
        </Button>
      </div>

      <div class="auth-footer">
        <span>已有账号？</span>
        <a class="auth-link" @click="goToLogin">去登录</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  overflow-y: auto;
  padding: 24px 16px;
  padding-top: calc(24px + var(--app-safe-area-top));
  padding-bottom: calc(24px + var(--app-safe-area-bottom));
  background: #eceff1;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(84, 110, 122, 0.18);
  border-radius: 8px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-soft);
  overflow: hidden;
}

.auth-header {
  padding: 24px 24px 8px;
  text-align: center;
}

.auth-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #37474f;
}

.auth-subtitle {
  margin-top: 4px;
  color: #455a64;
}

.auth-body {
  display: grid;
  gap: 14px;
  padding: 16px 24px;
}

.auth-field {
  display: grid;
  gap: 6px;
}

.auth-field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #455a64;
  font-size: 13px;
  font-weight: 600;
}

.auth-field-label svg {
  width: 16px;
  height: 16px;
}

.auth-btn {
  width: 100%;
  min-height: 40px;
  margin-top: 2px;
  padding: 0 16px;
  font-size: 15px;
}

.auth-btn-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 40px;
  line-height: 1;
}

.auth-btn-content svg {
  height: 20px;
  width: 20px;
  margin: 0;
}

.auth-footer {
  padding: 12px 24px;
  text-align: center;
  border-top: 1px solid #eceff1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #455a64;
  font-size: 13px;
}

.auth-link {
  color: #546e7a;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .auth-page {
    align-items: flex-start;
    padding: 16px 10px;
    padding-top: calc(16px + var(--app-safe-area-top));
    padding-bottom: calc(16px + var(--app-safe-area-bottom));
  }

  .auth-card {
    max-width: 100%;
  }

  .auth-header {
    padding: 20px 18px 6px;
  }

  .auth-body {
    padding: 12px 18px 18px;
  }

  .auth-footer {
    padding: 12px 18px;
  }
}
</style>
