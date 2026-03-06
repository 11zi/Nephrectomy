<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SideBar from './views/SideBar.vue'
import Content from './views/Content.vue'
import AppSnackbar from './components/AppSnackbar.vue'
import { registerSnackbar } from './composables/useSnackbar'

const snackbarRef = ref<InstanceType<typeof AppSnackbar> | null>(null)

onMounted(() => {
  if (snackbarRef.value) {
    registerSnackbar(snackbarRef.value.show)
  }
})
</script>

<template>
  <SideBar />
  <Content />
  <AppSnackbar ref="snackbarRef" />
</template>
