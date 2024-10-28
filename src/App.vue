<script setup lang="ts">
// import { ref } from 'vue'
//
// const isCollapse = ref(true)
// const handleOpen = (key: string, keyPath: string[]) => {
//   console.log(key, keyPath)
// }
// const handleClose = (key: string, keyPath: string[]) => {
//   console.log(key, keyPath)
// }
</script>

<template>
  <!-- <div class="common-layout" id="App">
    <el-container>
      <el-aside width="200px">Aside</el-aside>
      <el-main>Main</el-main>
    </el-container>
  </div> -->

  <el-container>
    <el-aside>我腰置顶</el-aside>
    <el-container>
      <el-header>置顶，占100宽度</el-header>
      <el-main>
        <el-empty description="这里放聊天内容"></el-empty>
      </el-main>
    </el-container>
  </el-container>
</template>
<!-- <el-menu
    default-active="2"
    :collapse="isCollapse"
    @open="handleOpen"
    @close="handleClose"
  >
    <el-sub-menu index="1">
      <template #title> 耋 </template>
      <span>导航一号</span>
      <el-menu-item-group>
        <template #title><span>第一组</span></template>
        <el-menu-item index="1-1">科目一</el-menu-item>
        <el-menu-item index="1-2">科目一</el-menu-item>
      </el-menu-item-group>
      <el-menu-item-group title="第二组">
        <el-menu-item index="1-3">科目三</el-menu-item>
      </el-menu-item-group>
    </el-sub-menu>
  </el-menu>
  <div class="el-main">
    <el-empty description="不可描述" />
    <el-radio-group v-model="isCollapse" style="margin-bottom: 20px">
      <el-radio-button :value="false">expand</el-radio-button>
      <el-radio-button :value="true">collapse</el-radio-button>
    </el-radio-group>
  </div> -->

<style></style>
