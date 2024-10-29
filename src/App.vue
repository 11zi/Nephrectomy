<script setup lang="ts">
import {
  HomeFilled,
  Menu as IconMenu,
  Cpu,
  Coin,
  Briefcase,
  User,
  ChatRound,
} from '@element-plus/icons-vue'
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}

import { reactive, toRefs } from 'vue'

const state = reactive({
  circleUrl:
    'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  squareUrl:
    'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
  sizeList: ['small', '', 'large'] as const,
})

const { circleUrl, squareUrl, sizeList } = toRefs(state)
</script>

<template>
  <el-container>
    <el-aside>
      <el-menu
        active-text-color="#ac6b26"
        background-color="#f1f2ef"
        class="el-menu-vertical-demo"
        default-active="2"
        text-color="#00303b"
        collapse-transition="true"
        close-on-click-outside="true"
        @open="handleOpen"
        @close="handleClose"
        style="height: 100vh"
      >
        <el-avatar
          :size="50"
          :src="circleUrl"
          style="margin-left: 2vw; margin-bottom: 5vh"
        />居中
        <el-sub-menu index="1">
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span>导航</span>
          </template>
          <el-menu-item index="1-1">房间信息</el-menu-item>
          <el-menu-item index="1-2">房间列表</el-menu-item>
          <el-menu-item index="1-3" disabled>注册/编辑</el-menu-item>
          <el-menu-item index="1-4">帮助</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2">
          <template #title>
            <el-icon><icon-menu /></el-icon>
            <span>板块</span>
          </template>
          <el-menu-item index="2-1">搜索</el-menu-item>
          <el-menu-item index="2-2">动态</el-menu-item>
          <el-menu-item index="2-3">广场</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="3">
          <template #title>
            <el-icon><Coin /></el-icon>
            <span>消费</span>
          </template>
          <el-menu-item index="3-1">银行</el-menu-item>
          <el-menu-item index="3-2">炒股</el-menu-item>
          <el-menu-item index="3-3">骰子</el-menu-item>
          <el-menu-item index="3-4">商城</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="4">
          <template #title>
            <el-icon><Briefcase /></el-icon>
            <span>工具</span>
          </template>
          <el-menu-item index="4-1">点播</el-menu-item>
          <el-menu-item index="4-2">便签</el-menu-item>
          <el-menu-item index="4-3">解析</el-menu-item>
          <el-menu-item index="4-4">清屏</el-menu-item>
          <el-menu-item index="4-5">隐式传送</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="5">
          <template #title>
            <el-icon><Cpu /></el-icon>
            <span>系统</span>
          </template>
          <el-menu-item index="5-1">设置</el-menu-item>
          <el-menu-item index="5-2">关于</el-menu-item>
          <el-menu-item index="5-3">重载</el-menu-item>
          <el-menu-item index="5-4">登出</el-menu-item>
          <el-menu-item index="5-5">2019年4月29日13点23分</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="6">
          <template #title>
            <el-icon><User /></el-icon>
            <span>联系人</span>
          </template>
        </el-sub-menu>
        <el-sub-menu index="7">
          <template #title>
            <el-icon><ChatRound /></el-icon>
            <span>消息</span>
          </template>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-main>
      <el-empty description="无内容"></el-empty>
    </el-main>
  </el-container>
</template>
<style></style>
