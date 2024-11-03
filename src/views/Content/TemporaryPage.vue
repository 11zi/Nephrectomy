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
    <li
      class="mdui-list-item mdui-ripple mdui-ripple-black"
      :onclick="OpenSideBar"
    >
      开
    </li>
    <li
      class="mdui-list-item mdui-ripple mdui-ripple-black"
      :onclick="CloseSideBar"
    >
      关
    </li>
    <li class="mdui-list-item mdui-ripple mdui-ripple-black">切换</li>
  </ul>
</template>
