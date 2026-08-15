<script setup lang="ts">
import { GitBranch } from 'lucide-vue-next'
import { renderSafeChatMessageHtml } from '../../../utils/chatMessageHtml'
import type { QuoteThreadNode } from '../../../utils/chatQuoteThread'

const props = defineProps<{
  nodes: QuoteThreadNode[]
}>()

const emit = defineEmits<{
  contentClick: [event: MouseEvent]
}>()

function renderContent(content: string) {
  return renderSafeChatMessageHtml(content)
}
</script>

<template>
  <div class="quote-thread-level">
    <div
      v-for="node in nodes"
      :key="node.message.id"
      class="quote-tree-node"
      :class="{ 'quote-thread-node-path': node.isPath }"
    >
      <div class="quote-thread-card" @click="emit('contentClick', $event)">
        <div class="quote-thread-meta">
          <GitBranch v-if="node.children.length > 1" :size="12" />
          <span>{{ node.message.sender.nickname }}</span>
        </div>
        <div class="quote-thread-content msg-rich-text" v-html="renderContent(node.message.content)"></div>
      </div>

      <QuoteThread
        v-if="node.children.length > 0"
        class="quote-thread-branch"
        :nodes="node.children"
        @content-click="emit('contentClick', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.quote-thread-level {
  --quote-line-color: rgba(84, 110, 122, 0.24);
  --quote-card-bg: rgba(255, 255, 255, 0.42);
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.quote-tree-node {
  position: relative;
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  align-items: start;
  column-gap: 18px;
  min-width: 0;
}

.quote-thread-card {
  position: relative;
  z-index: 1;
  width: 132px;
  min-width: 0;
  max-height: 76px;
  justify-self: start;
  align-self: start;
  overflow: hidden;
  border: 1px solid rgba(84, 110, 122, 0.13);
  border-left: 2px solid rgba(84, 110, 122, 0.3);
  border-radius: 0 6px 6px 0;
  padding: 5px 8px;
  background: var(--quote-card-bg);
  color: #607d8b;
  box-shadow: none;
}

.quote-thread-node-path > .quote-thread-card {
  border-left-color: rgba(69, 90, 100, 0.48);
  background: rgba(255, 255, 255, 0.56);
}

.quote-thread-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin-bottom: 2px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  color: #546e7a;
}

.quote-thread-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quote-thread-content {
  display: -webkit-box;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.35;
  color: #607d8b;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.quote-thread-branch {
  position: relative;
  width: 100%;
  margin-top: 0;
  padding-top: 0;
  padding-left: 16px;
}

.quote-thread-branch::before {
  position: absolute;
  top: 38px;
  left: 0;
  width: 16px;
  height: 1px;
  background: var(--quote-line-color);
  content: '';
}

.quote-thread-branch > :deep(.quote-thread-level) {
  position: relative;
}

.quote-thread-branch > :deep(.quote-thread-level)::before {
  display: none;
}

.quote-thread-branch > :deep(.quote-thread-level:has(> .quote-tree-node:only-child))::before {
  display: none;
}

.quote-thread-branch > :deep(.quote-tree-node)::before {
  position: absolute;
  top: 38px;
  left: -16px;
  width: 16px;
  height: 1px;
  background: var(--quote-line-color);
  content: '';
}

@media (max-width: 600px) {
  .quote-thread-level {
    gap: 6px;
  }

  .quote-tree-node {
    grid-template-columns: 116px minmax(0, 1fr);
    column-gap: 12px;
  }

  .quote-thread-card {
    width: 116px;
    max-height: 72px;
    padding: 5px 7px;
  }

  .quote-thread-branch {
    padding-left: 12px;
  }

  .quote-thread-branch::before {
    width: 12px;
  }

  .quote-thread-branch > :deep(.quote-tree-node)::before {
    left: -12px;
    width: 12px;
  }
}
</style>
