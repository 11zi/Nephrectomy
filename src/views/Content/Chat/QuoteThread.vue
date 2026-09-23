<script setup lang="ts">
import { ref } from 'vue'
import { GitBranch } from 'lucide-vue-next'
import { renderSafeChatMessageHtml } from '../../../utils/chatMessageHtml'
import type { ChatMessage } from '../../../types/chatTypes'
import type { QuoteThreadNode } from '../../../utils/chatQuoteThread'

const props = defineProps<{
  nodes: QuoteThreadNode[]
}>()

const emit = defineEmits<{
  contentClick: [event: MouseEvent]
  messageContextMenu: [event: MouseEvent, message: ChatMessage]
}>()

const expandedBranchIds = ref(new Set<string>())

function renderContent(content: string) {
  return renderSafeChatMessageHtml(content)
}

function continuationChild(node: QuoteThreadNode) {
  return node.children.find(child => child.isPath)
    ?? (node.children.length === 1 ? node.children[0] : undefined)
}

function branchChildren(node: QuoteThreadNode) {
  const continuation = continuationChild(node)
  return node.children.filter(child => child !== continuation)
}

function continuationNodes(node: QuoteThreadNode) {
  const continuation = continuationChild(node)
  return continuation ? [continuation] : []
}

function forwardMessageContextMenu(event: MouseEvent, message: ChatMessage) {
  emit('messageContextMenu', event, message)
}

function toggleBranch(messageId: string) {
  const nextIds = new Set(expandedBranchIds.value)
  if (nextIds.has(messageId)) nextIds.delete(messageId)
  else nextIds.add(messageId)
  expandedBranchIds.value = nextIds
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
      <div class="quote-thread-card-row">
        <div
          class="quote-thread-card"
          @click="emit('contentClick', $event)"
          @contextmenu.prevent.stop="emit('messageContextMenu', $event, node.message)"
        >
          <div class="quote-thread-meta">
            <span>{{ node.message.sender.nickname }}</span>
          </div>
          <div class="quote-thread-content msg-rich-text" v-html="renderContent(node.message.content)"></div>
        </div>

        <div v-if="branchChildren(node).length" class="quote-thread-branch-actions">
          <button
            v-for="branch in branchChildren(node)"
            :key="branch.message.id"
            class="quote-thread-branch-toggle"
            :class="{ 'quote-thread-branch-toggle-active': expandedBranchIds.has(branch.message.id) }"
            type="button"
            :title="`${expandedBranchIds.has(branch.message.id) ? '收起' : '展开'} ${branch.message.sender.nickname} 的支线`"
            :aria-label="`${expandedBranchIds.has(branch.message.id) ? '收起' : '展开'} ${branch.message.sender.nickname} 的支线`"
            :aria-expanded="expandedBranchIds.has(branch.message.id)"
            @click="toggleBranch(branch.message.id)"
          >
            <GitBranch :size="15" />
          </button>
        </div>
      </div>

      <QuoteThread
        v-for="branch in branchChildren(node).filter(item => expandedBranchIds.has(item.message.id))"
        :key="`expanded-${branch.message.id}`"
        class="quote-thread-expanded-branch"
        :nodes="[branch]"
        @content-click="emit('contentClick', $event)"
        @message-context-menu="forwardMessageContextMenu"
      />

      <QuoteThread
        v-if="continuationChild(node)"
        class="quote-thread-continuation"
        :nodes="continuationNodes(node)"
        @content-click="emit('contentClick', $event)"
        @message-context-menu="forwardMessageContextMenu"
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
  gap: 0;
  width: 100%;
  min-width: 0;
}

.quote-tree-node {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quote-thread-card-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.quote-thread-card {
  width: min(560px, 100%);
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(84, 110, 122, 0.13);
  border-left: 3px solid rgba(84, 110, 122, 0.3);
  border-radius: 0 7px 7px 0;
  padding: 7px 10px;
  background: var(--quote-card-bg);
  color: #607d8b;
  box-shadow: none;
  cursor: context-menu;
}

.quote-thread-node-path > .quote-thread-card-row > .quote-thread-card {
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
  line-height: 1.45;
  color: #607d8b;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.quote-thread-branch-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
}

.quote-thread-branch-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(84, 110, 122, 0.16);
  border-radius: 50%;
  padding: 0;
  background: rgba(255, 255, 255, 0.64);
  color: #78909c;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.quote-thread-branch-toggle:hover,
.quote-thread-branch-toggle-active {
  border-color: rgba(69, 90, 100, 0.34);
  background: rgba(84, 110, 122, 0.12);
  color: #455a64;
}

.quote-thread-continuation {
  position: relative;
  width: 100%;
  margin-left: 0;
  padding-top: 9px;
  padding-left: 0;
}

.quote-thread-continuation::before {
  position: absolute;
  top: 0;
  left: 14px;
  width: 1px;
  height: 9px;
  background: var(--quote-line-color);
  content: '';
}

.quote-thread-continuation::after {
  display: none;
}

.quote-thread-expanded-branch {
  position: relative;
  width: calc(100% - 42px);
  margin: 8px 0 0 34px;
  border-left: 1px dashed rgba(84, 110, 122, 0.3);
  padding: 8px 0 8px 12px;
  border-radius: 0 6px 6px 0;
  background: rgba(84, 110, 122, 0.04);
}

.quote-thread-expanded-branch::before {
  position: absolute;
  top: 24px;
  left: -12px;
  width: 12px;
  height: 1px;
  background: var(--quote-line-color);
  content: '';
}

@media (max-width: 600px) {
  .quote-thread-card {
    width: 100%;
    padding: 6px 8px;
  }

  .quote-thread-expanded-branch {
    width: calc(100% - 28px);
    margin-left: 22px;
    padding-left: 8px;
  }
}
</style>
