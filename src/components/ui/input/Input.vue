<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: string
    type?: string
    modelValue?: string | number
  }>(),
  {
    type: 'text',
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputClass = computed(() =>
  cn(
    'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :class="inputClass"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
