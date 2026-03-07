<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import '../../../assets/js/marked.min.js'

const props = defineProps({
  raw_msg: String,
  avatar_url: String,
  sender_name: {
    type: String,
    default: '哈米斯基',
  },
  timestamp: {
    type: String,
    default: '',
  },
})

const safeHtml = computed(() => {
  if (!props.raw_msg) return ''
  const parsed = marked.parse(props.raw_msg)
  return DOMPurify.sanitize(parsed, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'code', 'pre',
      'blockquote', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'hr', 'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    FORCE_BODY: true,
  })
})

// ---- 右键菜单 ----
const menuItems = [
  { icon: 'reply',        label: '引用' },
  { icon: 'person',       label: 'At' },
  { icon: 'content_copy', label: '复读' },
  { icon: 'undo',         label: '撤回' },
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  mdui.dialog({
    content: menuItems.map(item =>
      `<div class="mdui-list-item mdui-ripple msg-action-item" data-action="${item.label}">
        <i class="mdui-list-item-icon mdui-icon material-icons">${item.icon}</i>
        <div class="mdui-list-item-content">${item.label}</div>
      </div>`
    ).join(''),
    cssClass: 'msg-action-dialog',
    buttons: [],
    history: false,
    onOpened: (s) => {
      s.$element[0].querySelectorAll('.msg-action-item').forEach((el) => {
        el.addEventListener('click', () => {
          handleAction(el.getAttribute('data-action'))
          s.close()
        })
      })
    },
  })
}

function handleAction(label: string | null) {
  // TODO: 实现各项功能
}
</script>

<template>
  <div class="msg-row anim_in" @contextmenu="onContextMenu">
    <img
      :src="props.avatar_url"
      alt="avatar"
      class="mdui-img-circle msg-avatar"
      width="40"
      height="40"
    />

    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-sender">{{ props.sender_name }}</span>
        <span v-if="props.timestamp" class="msg-time">{{ props.timestamp }}</span>
      </div>
      <div class="msg-bubble mdui-typo" v-html="safeHtml"></div>
    </div>
  </div>
</template>

<style>
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 0;
}

.msg-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.msg-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 100%;
}

.msg-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.msg-sender {
  font-size: 12px;
  font-weight: 600;
  color: #546e7a;
}

.msg-time {
  font-size: 11px;
  color: #90a4ae;
}

.msg-bubble {
  display: inline-block;
  background: #eceff1;
  border-radius: 0 8px 8px 8px;
  padding: 8px 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  word-break: break-word;
}

.msg-bubble p:first-child { margin-top: 0; }
.msg-bubble p:last-child  { margin-bottom: 0; }

/* 消息操作 dialog 宽度，用双 class 提高特异性覆盖 mdui */
.mdui-dialog.msg-action-dialog {
  width: 400px;
  min-width: 220px;
}

/* dialog 内菜单项样式 */
.msg-action-item {
  cursor: pointer;
}

.anim_in {
  animation-duration: 200ms;
  animation-fill-mode: both;
  animation-name: fadeInLeft;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>