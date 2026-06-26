<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useContentStore } from '../../stores/useContentStore'
import { useUserStore } from '../../stores/useUserStore'
import { useSnackbar } from '../../composables/useSnackbar'
import { validateProfile } from '../../types/accountTypes'
import type { AccountProfile } from '../../types/accountTypes'
import { DEFAULT_ROOM_ID } from '../../stores/useRoomStore'

const contentStore = useContentStore()
const userStore = useUserStore()
const snackbar = useSnackbar()

// ---- 表单状态 ----
const profile = ref<AccountProfile>({
  uid: userStore.currentUser?.id ?? 'unknown',
  avatarUrl: '',
  nickname: '',
  motto: '',
  gender: true,
  birthday: '',
  age: -1,
  address: '',
  hobbies: [],
  friends: [],
  email: '',
  website: '',
  community: '',
  titles: [],
  likes: 0,
  following: [],
  followers: [],
  money: 0,
  bankDeposit: 0,
  albums: [],
  visitCount: 0,
  accountStatus: 0,
  currentRoom: DEFAULT_ROOM_ID,
  lastOnline: '',
  onlineDuration: 0,
  registeredAt: '',
  peerId: '',
})

// 初始化时从 store 加载已保存的资料
onMounted(async () => {
  const saved = await userStore.loadProfile()
  if (saved.nickname) {
    profile.value = { ...saved }
  }
  // mdui textfield floating label 需要重新扫描 DOM
  await nextTick()
  mdui.mutation()
})

const avatarPreview = computed(() =>
  profile.value.avatarUrl || (userStore.currentUser?.avatarUrl ?? '')
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
  if (file.size > 5 * 1024 * 1024) {
    snackbar.error('头像文件不能超过 5MB')
    return
  }
  compressAvatar(file)
}

/** 将图片压缩到适合网页的头像尺寸（最大 256px，JPEG 质量 0.75） */
function compressAvatar(file: File) {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)

    const MAX_SIZE = 256
    let { width, height } = img
    if (width > MAX_SIZE || height > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, width, height)

    profile.value.avatarUrl = canvas.toDataURL('image/jpeg', 0.75)
  }
  img.onerror = () => {
    URL.revokeObjectURL(url)
    snackbar.error('图片加载失败，请重试')
  }
  img.src = url
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

async function handleSubmit() {
  const errors = validateProfile(profile.value)
  if (errors.length > 0) {
    errors.forEach((err, i) => {
      setTimeout(() => snackbar.error(err.message), i * 300)
    })
    return
  }

  isSubmitting.value = true
  try {
    await userStore.saveProfile(profile.value)
    snackbar.success('保存成功！')
    contentStore.navigateTo('chat')
  } catch (err) {
    snackbar.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

const genderOptions = [
  { value: true,  label: '男' },
  { value: false, label: '女' },
]
</script>

<template>
  <div class="account-edit-page">

    <!-- 顶部导航栏 -->
    <div class="mdui-appbar mdui-color-blue-grey mdui-shadow-2" style="flex-shrink: 0; display: flex; align-items: center; padding: 0 8px; height: 56px;">
      <button class="mdui-btn mdui-btn-icon mdui-ripple mdui-color-white" style="opacity:1;" @click="contentStore.navigateTo('chat')">
        <i class="mdui-icon material-icons">arrow_back</i>
      </button>
      <span style="flex:1; margin-left:8px; font-size:18px; font-weight:500; color:#fff; letter-spacing:0.02em;">编辑资料</span>
      <button
        class="mdui-btn mdui-ripple"
        :disabled="isSubmitting"
        @click="handleSubmit"
        style="color:#fff; border-color:rgba(255,255,255,0.35);"
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
            <i class="mdui-icon material-icons" style="color:#fff;">photo_camera</i>
          </div>
        </div>
        <p class="ae-avatar-hint mdui-typo-caption" style="color:#78909c;">点击更换头像（≤5MB，自动压缩）</p>
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onAvatarChange"
        />
      </div>

      <!-- 基本信息卡片 -->
      <div class="mdui-card">
        <div class="mdui-list-item-one-line" style="font-size:12px; font-weight:600; color:#546e7a; text-transform:uppercase; padding-bottom:8px; border-bottom:1px solid #eceff1; margin-bottom:8px;">
          基本信息
        </div>
        <div style="padding: 0 8px 6px 8px;">

          <!-- 昵称 -->
          <div class="mdui-textfield mdui-textfield-floating-label">
            <i class="mdui-icon material-icons mdui-textfield-icon">person</i>
            <label class="mdui-textfield-label">昵称 <span style="color:#e53935;">*</span></label>
            <input
              class="mdui-textfield-input"
              v-model="profile.nickname"
              type="text"
              maxlength="24"
              required
            />
          </div>

          <!-- 签名 -->
          <div class="mdui-textfield mdui-textfield-floating-label">
            <i class="mdui-icon material-icons mdui-textfield-icon">short_text</i>
            <label class="mdui-textfield-label">签名</label>
            <input
              class="mdui-textfield-input"
              v-model="profile.motto"
              type="text"
              maxlength="100"
            />
            <div class="mdui-textfield-counter">{{ profile.motto.length }}/100</div>
          </div>

          <!-- 性别 -->
          <div class="ae-field-row">
            <i class="mdui-icon material-icons ae-field-icon">wc</i>
            <span class="ae-field-label">性别</span>
            <label
              v-for="opt in genderOptions"
              :key="String(opt.value)"
              style="display:flex; align-items:center; gap:4px; cursor:pointer; font-size:14px; color:#546e7a; user-select:none;"
              @click="profile.gender = opt.value"
            >
              <i class="mdui-icon material-icons" style="font-size:20px;">{{ profile.gender === opt.value ? 'radio_button_checked' : 'radio_button_unchecked' }}</i>
              {{ opt.label }}
            </label>
          </div>

          <!-- 生日 -->
          <div class="ae-field-row">
            <i class="mdui-icon material-icons ae-field-icon">cake</i>
            <span class="ae-field-label">生日</span>
            <input
              v-model="profile.birthday"
              type="date"
              style="width:0; flex:1; border:none; border-bottom:1px solid #cfd8dc; padding:4px 0; font-size:14px; color:#546e7a; outline:none; background:transparent;"
            />
          </div>
        </div>
      </div>

      <!-- 爱好卡片 -->
      <div class="mdui-card">
        <div class="mdui-list-item-one-line" style="font-size:12px; font-weight:600; color:#546e7a; text-transform:uppercase; padding-bottom:8px; border-bottom:1px solid #eceff1; margin-bottom:8px;">
          爱好
        </div>
        <div style="padding: 0 8px;">
          <!-- 爱好输入 -->
          <div style="display:flex; gap:8px; align-items:flex-end; margin-bottom:12px;">
            <div class="mdui-textfield mdui-textfield-floating-label" style="flex:1;">
              <label class="mdui-textfield-label">爱好</label>
              <input
                class="mdui-textfield-input"
                v-model="hobbyInput"
                type="text"
                maxlength="20"
                @keydown="onHobbyKeydown"
              />
            </div>
            <button class="mdui-btn mdui-btn-icon mdui-btn-raised mdui-ripple mdui-color-blue-grey" @click="addHobby">
              <i class="mdui-icon material-icons">add</i>
            </button>
          </div>

          <!-- 爱好标签用 mdui-chip -->
          <div style="display:flex; flex-wrap:wrap; gap:8px; min-height:32px;">
            <span v-if="profile.hobbies.length === 0" class="mdui-typo-caption" style="color:#b0bec5; align-self:center;">暂无爱好</span>
            <div
              v-for="(h, i) in profile.hobbies"
              :key="i"
              class="mdui-chip"
            >
              <span class="mdui-chip-title">{{ h }}</span>
              <span class="mdui-chip-delete mdui-ripple" @click="removeHobby(i)" style="cursor:pointer;">
                <i class="mdui-icon material-icons" style="font-size:16px;">close</i>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系方式卡片 -->
      <div class="mdui-card">
        <div class="mdui-list-item-one-line" style="font-size:12px; font-weight:600; color:#546e7a; text-transform:uppercase; padding-bottom:8px; border-bottom:1px solid #eceff1; margin-bottom:8px;">
          联系方式
        </div>
        <div style="padding: 0 8px;">

          <!-- 邮箱 -->
          <div class="mdui-textfield mdui-textfield-floating-label">
            <i class="mdui-icon material-icons mdui-textfield-icon">email</i>
            <label class="mdui-textfield-label">邮箱</label>
            <input
              class="mdui-textfield-input"
              v-model="profile.email"
              type="email"
            />
          </div>

          <!-- 个人网站 -->
          <div class="mdui-textfield mdui-textfield-floating-label">
            <i class="mdui-icon material-icons mdui-textfield-icon">link</i>
            <label class="mdui-textfield-label">个人网站</label>
            <input
              class="mdui-textfield-input"
              v-model="profile.website"
              type="url"
            />
          </div>

          <!-- 住址 -->
          <div class="mdui-textfield mdui-textfield-floating-label">
            <i class="mdui-icon material-icons mdui-textfield-icon">location_on</i>
            <label class="mdui-textfield-label">住址</label>
            <input
              class="mdui-textfield-input"
              v-model="profile.address"
              type="text"
            />
          </div>
        </div>
      </div>

      <!-- 底部保存按钮 -->
      <div style="padding: 8px 0 24px; text-align: center;">
        <button
          class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-blue-grey mdui-shadow-2"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <i class="mdui-icon material-icons mdui-icon-left">save</i>
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

.ae-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

/* 头像相关 — mdui v1 无对应组件，保留少量自定义 */
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
}

.ae-avatar-wrap:hover .ae-avatar-overlay { opacity: 1; }

.ae-avatar-hint { margin-top: 8px; }

/* 卡片内部留白微调 */
.mdui-card { padding: 16px; }

/* ── 性别 / 生日 ── */
.ae-field-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 48px;
}
.ae-field-row + .ae-field-row {
  margin-top: -8px;
}
.ae-field-row > .ae-field-icon {
  font-size: 24px;
  color: #78909c;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}
.ae-field-label {
  font-size: 12px;
  color: #78909c;
  font-weight: 500;
  margin-right: 8px;
  white-space: nowrap;
}

/* mdui-color-white 覆盖顶栏图标按钮 */
.mdui-color-white { color: #fff !important; background: transparent !important; }
</style>
