<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
const cardClass = computed(() => cn('bg-card text-card-foreground rounded-lg border shadow-sm', props.class))
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>
