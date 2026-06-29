<script setup lang="ts">
import { ref } from 'vue'
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
    <div class="auth-card mdui-card mdui-shadow-4">
      <div class="auth-header">
        <h2 class="auth-title">注册</h2>
        <p class="auth-subtitle mdui-typo-caption">创建账号，加入肾摘除聊天室</p>
      </div>

      <div class="auth-body">
        <!-- 昵称 -->
        <div class="mdui-textfield mdui-textfield-floating-label">
          <i class="mdui-icon material-icons mdui-textfield-icon">person</i>
          <label class="mdui-textfield-label">昵称</label>
          <input
            class="mdui-textfield-input"
            v-model="nickname"
            type="text"
            maxlength="24"
            @keydown.enter="handleRegister"
          />
        </div>

        <!-- 邮箱 -->
        <div class="mdui-textfield mdui-textfield-floating-label">
          <i class="mdui-icon material-icons mdui-textfield-icon">email</i>
          <label class="mdui-textfield-label">邮箱</label>
          <input
            class="mdui-textfield-input"
            v-model="email"
            type="email"
            autocomplete="email"
            @keydown.enter="handleRegister"
          />
        </div>

        <!-- 密码 -->
        <div class="mdui-textfield mdui-textfield-floating-label">
          <i class="mdui-icon material-icons mdui-textfield-icon">lock</i>
          <label class="mdui-textfield-label">密码（至少 6 位）</label>
          <input
            class="mdui-textfield-input"
            v-model="password"
            type="password"
            autocomplete="new-password"
          />
        </div>

        <!-- 确认密码 -->
        <div class="mdui-textfield mdui-textfield-floating-label">
          <i class="mdui-icon material-icons mdui-textfield-icon">lock_outline</i>
          <label class="mdui-textfield-label">确认密码</label>
          <input
            class="mdui-textfield-input"
            v-model="passwordConfirm"
            type="password"
            autocomplete="new-password"
            @keydown.enter="handleRegister"
          />
        </div>

        <!-- 注册按钮 -->
        <button
          class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-blue-grey auth-btn"
          :disabled="isSubmitting"
          @click="handleRegister"
        >
          <span class="auth-btn-content">
            <i class="mdui-icon material-icons">{{ isSubmitting ? 'hourglass_empty' : 'person_add' }}</i>
            <span>{{ isSubmitting ? '注册中…' : '注册' }}</span>
          </span>
        </button>
      </div>

      <div class="auth-footer">
        <span class="mdui-typo-caption" style="color: #455a64;">已有账号？</span>
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
  border-radius: 8px;
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
  padding: 16px 24px;
}

.auth-btn {
  width: 100%;
  min-height: 40px;
  margin-top: 12px;
  padding: 0 16px;
  font-size: 15px;
  line-height: 40px;
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

.auth-btn-content .mdui-icon {
  height: 20px;
  margin: 0;
  font-size: 20px;
  line-height: 20px;
}

.auth-footer {
  padding: 12px 24px;
  text-align: center;
  border-top: 1px solid #eceff1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
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
