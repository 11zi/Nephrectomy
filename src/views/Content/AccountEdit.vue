<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  AlignLeft,
  BadgeCheck,
  Cake,
  Camera,
  Check,
  Hourglass,
  Image as ImageIcon,
  Link,
  Mail,
  MapPin,
  Plus,
  Save,
  User,
  VenusAndMars,
  X,
} from 'lucide-vue-next'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
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
  identityId: userStore.currentUser?.identityId ?? '',
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
  stockShares: 0,
  stockAutoBuyPrice: null,
  stockAutoSellPrice: null,
  albums: [],
  visitCount: 0,
  accountStatus: 0,
  isOnline: false,
  presenceStatus: '',
  presenceDetail: '',
  presenceUntil: null,
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
})

const avatarPreview = computed(
  () => profile.value.avatarUrl || (userStore.currentUser?.avatarUrl ?? ''),
)

const backgroundImage = computed({
  get: () => profile.value.albums[0] ?? '',
  set: (value: string) => {
    const trimmedValue = value.trim()
    profile.value.albums = trimmedValue
      ? [trimmedValue, ...profile.value.albums.slice(1)]
      : profile.value.albums.slice(1)
  },
})

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
  { value: true, label: '男' },
  { value: false, label: '女' },
]
</script>

<template>
  <div class="app-page account-edit-page">
    <!-- 顶部导航栏 -->
    <div class="app-page-header">
      <Button
        class="app-header-icon-button"
        variant="ghost"
        size="icon"
        type="button"
        title="返回聊天室"
        @click="contentStore.navigateTo('chat')"
      >
        <X />
      </Button>

      <div class="app-page-title">
        <span>编辑资料</span>
      </div>

      <div class="app-page-actions">
        <Button
          class="app-page-action-button"
          type="button"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <Hourglass v-if="isSubmitting" />
          <Check v-else />
          {{ isSubmitting ? '保存中…' : '保存' }}
        </Button>
      </div>
    </div>

    <div class="app-scroll ae-body">
      <div class="ae-hero">
        <div class="ae-identity">
          <button class="ae-avatar-wrap" type="button" @click="onAvatarClick" title="点击更换头像">
            <img :src="avatarPreview" alt="avatar" class="ae-avatar-img" />
            <span class="ae-avatar-overlay">
              <Camera />
            </span>
          </button>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="ae-file-input"
            @change="onAvatarChange"
          />

          <label class="ae-hero-field">
            <span>
              <User />
              昵称 <em>*</em>
            </span>
            <Input v-model="profile.nickname" type="text" maxlength="24" required />
          </label>

          <div class="ae-identity-id">
            <span>
              <BadgeCheck />
              身份 ID
            </span>
            <strong>{{ profile.identityId }}</strong>
          </div>

          <label class="ae-hero-field">
            <span>
              <AlignLeft />
              签名
            </span>
            <Textarea v-model="profile.motto" maxlength="100" rows="3" />
            <strong>{{ profile.motto.length }}/100</strong>
          </label>
        </div>

        <section class="ae-cover-editor">
          <div
            class="ae-cover-preview"
            :class="{ empty: !backgroundImage }"
            :style="backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined"
          >
            <span v-if="!backgroundImage">背景图片</span>
          </div>

          <label class="ae-cover-field">
            <span>
              <ImageIcon />
              背景图片链接
            </span>
            <Input
              v-model="backgroundImage"
              type="url"
              placeholder="https://example.com/background.jpg"
            />
          </label>
        </section>
      </div>

      <div class="ae-grid">
        <section class="ae-section">
          <div class="ae-section-title">基本信息</div>
          <div class="ae-fields">
            <div class="ae-field-row">
              <VenusAndMars />
              <span>性别</span>
              <div class="ae-segmented">
                <button
                  v-for="opt in genderOptions"
                  :key="String(opt.value)"
                  class="ae-gender-option"
                  type="button"
                  :class="{ active: profile.gender === opt.value }"
                  @click="profile.gender = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <label class="ae-field-row">
              <Cake />
              <span>生日</span>
              <input v-model="profile.birthday" type="date" class="ae-date-input" />
            </label>

            <label class="ae-field-row">
              <MapPin />
              <span>住址</span>
              <Input v-model="profile.address" type="text" />
            </label>
          </div>
        </section>

        <section class="ae-section">
          <div class="ae-section-title">爱好</div>
          <div class="ae-hobby-input-row">
            <Input
              v-model="hobbyInput"
              type="text"
              maxlength="20"
              placeholder="添加爱好"
              @keydown="onHobbyKeydown"
            />
            <Button size="icon" type="button" title="添加爱好" @click="addHobby">
              <Plus />
            </Button>
          </div>

          <div class="ae-hobby-list">
            <span v-if="profile.hobbies.length === 0" class="ae-empty-text">暂无爱好</span>
            <Badge v-for="(h, i) in profile.hobbies" :key="i" variant="secondary" class="ae-hobby-chip">
              {{ h }}
              <button
                class="ae-hobby-delete"
                type="button"
                title="删除爱好"
                @click.stop="removeHobby(i)"
              >
                <X />
              </button>
            </Badge>
          </div>
        </section>

        <section class="ae-section ae-contact-section">
          <div class="ae-section-title">联系</div>
          <div class="ae-fields">
            <label class="ae-field-row">
              <Mail />
              <span>邮箱</span>
              <Input v-model="profile.email" type="email" />
            </label>

            <label class="ae-field-row">
              <Link />
              <span>个人网站</span>
              <Input v-model="profile.website" type="url" />
            </label>
          </div>
        </section>
      </div>

      <!-- 底部保存按钮 -->
      <div class="ae-footer-actions">
        <Button
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <Save />
          {{ isSubmitting ? '保存中…' : '保存资料' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-edit-page {
  background: var(--app-bg-soft);
}

.ae-body {
  --profile-content-max: 1180px;
  position: relative;
  padding-top: 12px;
  padding-bottom: 24px;
}

.ae-hero {
  display: grid;
  grid-template-columns: minmax(220px, 320px) minmax(320px, 1fr);
  gap: 16px;
  align-items: stretch;
  max-width: var(--profile-content-max);
  margin: 0 auto;
  padding: 24px 16px 12px;
}

.ae-identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.ae-avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border: 0;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.ae-avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ae-avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.42);
  opacity: 0;
  transition: opacity 0.2s;
}

.ae-avatar-overlay svg {
  width: 28px;
  height: 28px;
  color: #fff;
}

.ae-avatar-wrap:hover .ae-avatar-overlay {
  opacity: 1;
}

.ae-file-input {
  display: none;
}

.ae-hero-field {
  display: grid;
  gap: 6px;
  width: min(420px, 100%);
  margin-top: 12px;
  color: #455a64;
  font-size: 13px;
  font-weight: 600;
}

.ae-hero-field span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ae-hero-field svg {
  width: 18px;
  height: 18px;
  color: #455a64;
}

.ae-hero-field em {
  color: #e53935;
  font-style: normal;
}

.ae-hero-field strong {
  justify-self: end;
  color: #78909c;
  font-size: 12px;
  font-weight: 500;
}

.ae-identity-id {
  display: grid;
  gap: 6px;
  width: min(420px, 100%);
  margin-top: 12px;
  color: #455a64;
  font-size: 13px;
  font-weight: 600;
}

.ae-identity-id span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ae-identity-id svg {
  width: 18px;
  height: 18px;
  color: #455a64;
}

.ae-identity-id strong {
  width: 100%;
  min-height: 38px;
  border: 1px solid rgba(84, 110, 122, 0.18);
  border-radius: 6px;
  padding: 8px 10px;
  background: #eceff1;
  color: #455a64;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.ae-cover-editor {
  display: grid;
  grid-template-rows: minmax(150px, 1fr) auto;
  gap: 12px;
  min-width: 0;
}

.ae-cover-preview {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed rgba(84, 110, 122, 0.22);
  border-radius: 8px;
  background-color: rgba(236, 239, 241, 0.66);
  background-position: center;
  background-size: cover;
  color: #455a64;
  font-size: 12px;
  font-weight: 600;
}

.ae-cover-preview:not(.empty) {
  border-style: solid;
}

.ae-cover-field {
  display: grid;
  gap: 6px;
  color: #455a64;
  font-size: 13px;
  font-weight: 600;
}

.ae-cover-field span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ae-cover-field svg {
  width: 18px;
  height: 18px;
  color: #455a64;
}

.ae-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  max-width: var(--profile-content-max);
  margin: 4px auto 0;
  padding: 0 16px;
}

.ae-section {
  grid-column: span 6;
  border: 1px solid rgba(84, 110, 122, 0.16);
  border-radius: 8px;
  padding: 16px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-soft);
}

.ae-contact-section {
  grid-column: span 6;
}

.ae-section-title {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eceff1;
  color: #37474f;
  font-size: 12px;
  font-weight: 700;
}

.ae-fields {
  display: grid;
  gap: 10px;
}

.ae-field-row {
  display: grid;
  grid-template-columns: 28px 72px minmax(0, 1fr);
  align-items: center;
  min-height: 38px;
  color: #455a64;
  gap: 0;
}

.ae-field-row > svg {
  width: 22px;
  height: 22px;
  color: #455a64;
}

.ae-field-row > span {
  color: #455a64;
  font-size: 14px;
  font-weight: 600;
}

.ae-segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ae-gender-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 32px;
  border: 1px solid rgba(84, 110, 122, 0.24);
  border-radius: 6px;
  color: #546e7a;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.ae-gender-option:hover {
  border-color: #78909c;
}

.ae-gender-option.active {
  border-color: #455a64;
  color: #fff;
  background: #455a64;
}

.ae-date-input {
  width: 100%;
  min-width: 0;
  border: 1px solid hsl(214.3 31.8% 91.4%);
  border-radius: 6px;
  padding: 8px 10px;
  color: #546e7a;
  background: #fff;
  font: inherit;
  outline: none;
}

.ae-date-input:focus {
  border-color: #78909c;
}

.ae-hobby-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.ae-hobby-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
}

.ae-hobby-chip {
  gap: 6px;
}

.ae-hobby-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: -4px;
  border: 0;
  border-radius: 999px;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.ae-hobby-delete:hover {
  background: rgba(84, 110, 122, 0.14);
}

.ae-hobby-delete svg {
  width: 12px;
  height: 12px;
}

.ae-empty-text {
  align-self: center;
  color: #455a64;
  font-size: 12px;
}

.ae-footer-actions {
  max-width: var(--profile-content-max);
  margin: 0 auto;
  padding: 18px 16px 24px;
  text-align: center;
}

@media (min-width: 1100px) {
  .ae-section {
    grid-column: span 4;
  }
}

@media (max-width: 720px) {
  .ae-hero {
    grid-template-columns: 1fr;
  }

  .ae-section,
  .ae-contact-section {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .app-page-header {
    padding: 8px 10px;
  }

  .app-page-action-button {
    min-width: 64px;
    padding: 0 10px;
  }

  .ae-body {
    padding: 10px;
    padding-bottom: calc(18px + var(--app-safe-area-bottom));
  }

  .ae-hero {
    gap: 10px;
    padding: 8px 0 4px;
  }

  .ae-identity {
    align-items: center;
    text-align: center;
  }

  .ae-avatar-wrap {
    width: 82px;
    height: 82px;
  }

  .ae-hero-field {
    width: 100%;
    text-align: left;
  }

  .ae-cover-editor {
    grid-template-rows: auto auto;
  }

  .ae-cover-preview {
    min-height: 112px;
  }

  .ae-grid {
    gap: 10px;
    padding: 0;
  }

  .ae-section {
    padding: 12px;
  }

  .ae-field-row {
    grid-template-columns: 26px 58px minmax(0, 1fr);
    min-height: 40px;
    font-size: 13px;
  }

  .ae-hobby-input-row {
    gap: 6px;
  }

  .ae-hobby-input-row button {
    flex: 0 0 44px;
  }

  .ae-footer-actions {
    padding-right: 0;
    padding-left: 0;
  }
}
</style>
