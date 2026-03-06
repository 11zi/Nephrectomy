<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '../../stores/useContentStore'
import { useSnackbar } from '../../composables/useSnackbar'
import { validateProfile } from '../../types/accountTypes'
import type { AccountProfile, Gender } from '../../types/accountTypes'

const contentStore = useContentStore()
const snackbar = useSnackbar()

// ---- 表单状态 ----
const profile = ref<AccountProfile>({
  avatar: '',
  nickname: '',
  status: '',
  gender: 'undisclosed',
  birthday: '',
  address: '',
  hobbies: [],
  friends: [],
  email: '',
  website: '',
})

const avatarPreview = computed(() =>
  profile.value.avatar || 'src/assets/static_image/r19.png'
)

// 爱好输入框的临时值
const hobbyInput = ref('')

// ---- 头像上传 ----
const avatarInput = ref<HTMLInputElement | null>(null)

function onAvatarClick() {
  avatarInput.value?.click()
}

function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    snackbar.error('请选择图片文件')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    snackbar.error('头像文件不能超过 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    profile.value.avatar = reader.result as string
  }
  reader.readAsDataURL(file)
}

// ---- 爱好管理 ----
function addHobby() {
  const h = hobbyInput.value.trim()
  if (!h) return
  if (profile.value.hobbies.length >= 5) {
    snackbar.error('爱好最多添加 5 个')
    return
  }
  if (h.length > 20) {
    snackbar.error('每个爱好不能超过 20 个字符')
    return
  }
  if (profile.value.hobbies.includes(h)) {
    snackbar.error('该爱好已存在')
    return
  }
  profile.value.hobbies.push(h)
  hobbyInput.value = ''
}

function removeHobby(index: number) {
  profile.value.hobbies.splice(index, 1)
}

function onHobbyKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addHobby()
  }
}

// ---- 提交 ----
const isSubmitting = ref(false)

function handleSubmit() {
  const errors = validateProfile(profile.value)
  if (errors.length > 0) {
    // 逐条展示，每条间隔300ms避免同时堆叠太多
    errors.forEach((err, i) => {
      setTimeout(() => snackbar.error(err.message), i * 300)
    })
    return
  }

  isSubmitting.value = true
  // TODO: 对接后端接口
  setTimeout(() => {
    isSubmitting.value = false
    snackbar.success('保存成功！')
  }, 800)
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'undisclosed', label: '不公开' },
  { value: 'male',        label: '男' },
  { value: 'female',      label: '女' },
  { value: 'other',       label: '其他' },
]
</script>

<template>
  <div class="account-edit-page">

    <!-- 顶部导航栏 -->
    <div class="ae-topbar">
      <button class="ae-back-btn mdui-ripple" @click="contentStore.navigateTo('chat')">
        <i class="mdui-icon material-icons">arrow_back</i>
      </button>
      <span class="ae-title">编辑资料</span>
      <button
        class="ae-save-btn mdui-ripple"
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        <i class="mdui-icon material-icons">{{ isSubmitting ? 'hourglass_empty' : 'check' }}</i>
        {{ isSubmitting ? '保存中…' : '保存' }}
      </button>
    </div>

    <div class="ae-body">

      <!-- 头像区域 -->
      <div class="ae-avatar-section">
        <div class="ae-avatar-wrap" @click="onAvatarClick" title="点击更换头像">
          <img :src="avatarPreview" alt="avatar" class="ae-avatar-img" />
          <div class="ae-avatar-overlay">
            <i class="mdui-icon material-icons">photo_camera</i>
          </div>
        </div>
        <p class="ae-avatar-hint">点击更换头像（≤2MB）</p>
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onAvatarChange"
        />
      </div>

      <!-- 表单卡片 -->
      <div class="ae-card">
        <div class="ae-section-title">基本信息</div>

        <!-- 昵称 -->
        <div class="ae-field">
          <label class="ae-label">昵称 <span class="ae-required">*</span></label>
          <div class="ae-input-wrap">
            <input
              class="ae-input"
              v-model="profile.nickname"
              type="text"
              maxlength="24"
              placeholder="请输入昵称"
            />
            <span class="ae-counter">{{ profile.nickname.length }}/24</span>
          </div>
        </div>

        <!-- 状态签名 -->
        <div class="ae-field">
          <label class="ae-label">状态签名</label>
          <div class="ae-input-wrap">
            <input
              class="ae-input"
              v-model="profile.status"
              type="text"
              maxlength="60"
              placeholder="说点什么…"
            />
            <span class="ae-counter">{{ profile.status.length }}/60</span>
          </div>
        </div>

        <!-- 性别 -->
        <div class="ae-field">
          <label class="ae-label">性别</label>
          <div class="ae-radio-group">
            <label
              v-for="opt in genderOptions"
              :key="opt.value"
              class="ae-radio-label"
              :class="{ active: profile.gender === opt.value }"
            >
              <input
                type="radio"
                :value="opt.value"
                v-model="profile.gender"
                style="display: none"
              />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <!-- 生日 -->
        <div class="ae-field">
          <label class="ae-label">生日</label>
          <input
            class="ae-input"
            v-model="profile.birthday"
            type="date"
          />
        </div>
      </div>

      <div class="ae-card">
        <div class="ae-section-title">爱好</div>

        <div class="ae-hobby-input-row">
          <input
            class="ae-input"
            v-model="hobbyInput"
            type="text"
            maxlength="20"
            placeholder="输入爱好后按 Enter 或点击添加"
            @keydown="onHobbyKeydown"
          />
          <button class="ae-hobby-add-btn mdui-ripple" @click="addHobby">
            <i class="mdui-icon material-icons">add</i>
          </button>
        </div>

        <div class="ae-hobby-tags">
          <span v-if="profile.hobbies.length === 0" class="ae-hobby-empty">暂无爱好</span>
          <span
            v-for="(h, i) in profile.hobbies"
            :key="i"
            class="ae-hobby-tag"
          >
            {{ h }}
            <i class="mdui-icon material-icons ae-hobby-remove" @click="removeHobby(i)">close</i>
          </span>
        </div>
      </div>

      <div class="ae-card">
        <div class="ae-section-title">联系方式</div>

        <!-- 邮箱 -->
        <div class="ae-field">
          <label class="ae-label">邮箱</label>
          <input
            class="ae-input"
            v-model="profile.email"
            type="email"
            placeholder="example@mail.com"
          />
        </div>

        <!-- 个人网站 -->
        <div class="ae-field">
          <label class="ae-label">个人网站</label>
          <input
            class="ae-input"
            v-model="profile.website"
            type="url"
            placeholder="https://example.com"
          />
        </div>

        <!-- 住址 -->
        <div class="ae-field">
          <label class="ae-label">住址</label>
          <input
            class="ae-input"
            v-model="profile.address"
            type="text"
            placeholder="房间 ID"
          />
        </div>
      </div>

      <!-- 底部保存按钮（移动端补充） -->
      <div class="ae-footer">
        <button
          class="ae-submit-btn mdui-ripple"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <i class="mdui-icon material-icons">save</i>
          {{ isSubmitting ? '保存中…' : '保存资料' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.account-edit-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #eceff1;
  overflow: hidden;
}

/* ---- 顶部导航 ---- */
.ae-topbar {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 56px;
  background: #546e7a;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.ae-back-btn {
  background: none;
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ae-title {
  flex: 1;
  font-size: 18px;
  font-weight: 500;
  margin-left: 8px;
  letter-spacing: 0.02em;
}

.ae-save-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.35);
  color: #fff;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.ae-save-btn:hover   { background: rgba(255,255,255,0.25); }
.ae-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ---- 滚动主体 ---- */
.ae-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ---- 头像 ---- */
.ae-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 8px;
}

.ae-avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.ae-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ae-avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #fff;
}
.ae-avatar-wrap:hover .ae-avatar-overlay { opacity: 1; }

.ae-avatar-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #78909c;
}

/* ---- 卡片 ---- */
.ae-card {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ae-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #546e7a;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eceff1;
}

/* ---- 字段 ---- */
.ae-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}
.ae-field:last-child { margin-bottom: 0; }

.ae-label {
  font-size: 12px;
  color: #78909c;
  font-weight: 500;
}

.ae-required { color: #e53935; }

.ae-input-wrap {
  position: relative;
}

.ae-input {
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid #b0bec5;
  background: transparent;
  padding: 6px 48px 6px 0;
  font-size: 14px;
  color: #37474f;
  outline: none;
  transition: border-color 0.2s;
}
.ae-input:focus { border-bottom-color: #546e7a; }
.ae-input::placeholder { color: #b0bec5; }

.ae-counter {
  position: absolute;
  right: 0;
  bottom: 6px;
  font-size: 11px;
  color: #b0bec5;
}

/* ---- 性别单选 ---- */
.ae-radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ae-radio-label {
  padding: 5px 14px;
  border-radius: 16px;
  border: 1px solid #b0bec5;
  font-size: 13px;
  color: #546e7a;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.ae-radio-label.active {
  background: #546e7a;
  border-color: #546e7a;
  color: #fff;
}

/* ---- 爱好 ---- */
.ae-hobby-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 12px;
}

.ae-hobby-add-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #546e7a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.ae-hobby-add-btn:hover { background: #455a64; }

.ae-hobby-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
}

.ae-hobby-empty {
  font-size: 13px;
  color: #b0bec5;
  align-self: center;
}

.ae-hobby-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #eceff1;
  border-radius: 16px;
  padding: 4px 10px 4px 12px;
  font-size: 13px;
  color: #37474f;
}

.ae-hobby-remove {
  font-size: 14px !important;
  color: #90a4ae;
  cursor: pointer;
  transition: color 0.15s;
}
.ae-hobby-remove:hover { color: #e53935; }

/* ---- 底部保存按钮 ---- */
.ae-footer {
  padding: 8px 0 24px;
  display: flex;
  justify-content: center;
}

.ae-submit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #546e7a;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 32px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: background 0.15s;
}
.ae-submit-btn:hover    { background: #455a64; }
.ae-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>