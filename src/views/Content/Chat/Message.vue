<script setup lang="ts">
const props = defineProps({
  html_msg: String,
})
</script>
<template>
  <div class="mdui-typo-body-1 mdui-valign mdui-hoverable mdui-shadow-1">
    <div style="margin-bottom: auto">
      <img
        src="../../../assets/static_image/r19.png"
        alt="avatar"
        class="mdui-img-circle mdui-m-a-1"
        width="40"
        height="40"
      />
    </div>
    <div class="" v-html="html_msg"></div>
  </div>
</template>
