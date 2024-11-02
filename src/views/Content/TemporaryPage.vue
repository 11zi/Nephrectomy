<script setup lang="ts">
function OpenSideBar() {
  // isSideBarCollapsed.value = true
  console.log('开着吧，有意思')
}
function CloseSideBar() {
  // isSideBarCollapsed.value = false
  console.log('关了吧，没意思')
}
</script>
<template>
  <ul class="mdui-list">
    <li class="mdui-list-item ripple" :onclick="OpenSideBar">开</li>
    <li class="mdui-list-item ripple" :onclick="CloseSideBar">关</li>
    <li class="mdui-list-item ripple">切换</li>
  </ul>
</template>
