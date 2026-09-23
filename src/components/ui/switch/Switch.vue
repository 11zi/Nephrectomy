<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue?: boolean
  disabled?: boolean
  class?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const switchClass = computed(() =>
  cn(
    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    props.modelValue ? 'bg-primary' : 'bg-input',
    props.class,
  ),
)
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="Boolean(modelValue)"
    :disabled="disabled"
    :class="switchClass"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      class="pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
    />
  </button>
</template>
