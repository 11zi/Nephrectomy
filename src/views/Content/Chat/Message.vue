<script setup lang="ts">
const props = defineProps({
  html_msg: String,
  avatar_url: String,
})
</script>
<template>
  <div
    class="mdui-typo-body-1 mdui-valign mdui-hoverable mdui-shadow-1 anim_in"
  >
    <div style="margin-bottom: auto">
      <img
        :src="avatar_url"
        alt="avatar"
        class="mdui-img-circle mdui-m-a-1"
        width="40"
        height="40"
      />
    </div>
    <div class="" v-html="html_msg"></div>
  </div>
</template>
<style>
.anim_in {
  animation-duration: 200ms;
  animation-fill-mode: both;
  animation-name: fadeInLeft;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>
