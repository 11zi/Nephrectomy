<script setup lang="ts">
import { computed } from 'vue'
import { AvatarRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
const avatarClass = computed(() => cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', props.class))
</script>

<template>
  <AvatarRoot :class="avatarClass">
    <slot />
  </AvatarRoot>
</template>
