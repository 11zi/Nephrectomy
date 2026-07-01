<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
const descriptionClass = computed(() => cn('text-muted-foreground text-sm', props.class))
</script>

<template>
  <p :class="descriptionClass">
    <slot />
  </p>
</template>
