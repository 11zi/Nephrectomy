<script setup lang="ts">
import { computed } from 'vue'
import { AvatarImage } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
  src?: string
  alt?: string
}>()

const imageClass = computed(() => cn('aspect-square size-full object-cover', props.class))
</script>

<template>
  <AvatarImage v-if="src" :src="src" :alt="alt" :class="imageClass" />
</template>
