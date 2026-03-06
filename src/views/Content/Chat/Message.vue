<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import '../../../assets/js/marked.min.js'

const props = defineProps({
  // 接收原始 Markdown 文本（而非 HTML）
  raw_msg: String,
  avatar_url: String,
})

const safeHtml = computed(() => {
  if (!props.raw_msg) return ''
  // 1. 将 Markdown 解析为 HTML
  const parsed = marked.parse(props.raw_msg)
  // 2. DOMPurify 过滤，移除危险标签和属性
  return DOMPurify.sanitize(parsed, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'em',
      'strong',
      'a',
      'code',
      'pre',
      'blockquote',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'del',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    // a 标签强制在新标签页打开，防止钓鱼跳转
    FORCE_BODY: true,
  })
})
</script>

<template>
  <div
    class="mdui-typo-body-1 mdui-valign mdui-hoverable mdui-shadow-1 anim_in"
  >
    <div style="margin-bottom: auto">
      <img
        :src="props.avatar_url"
        alt="avatar"
        class="mdui-img-circle mdui-m-a-1"
        width="40"
        height="40"
      />
    </div>
    <!-- 渲染经过 DOMPurify 过滤后的安全 HTML -->
    <div class="mdui-typo" v-html="safeHtml"></div>
  </div>
</template>

<style>
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
