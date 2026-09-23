<script setup lang="ts">
import { computed } from 'vue'
import { AvatarFallback } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
  delayMs?: number
}>()

const fallbackClass = computed(() =>
  cn('bg-muted flex size-full items-center justify-center rounded-full text-sm font-medium', props.class),
)
</script>

<template>
  <AvatarFallback :delay-ms="delayMs" :class="fallbackClass">
    <slot />
  </AvatarFallback>
</template>
