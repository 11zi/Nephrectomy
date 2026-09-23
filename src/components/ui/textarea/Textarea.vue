<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
  modelValue?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaClass = computed(() =>
  cn(
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <textarea
    :value="modelValue"
    :class="textareaClass"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
