<script setup lang="ts">
import {
  HomeFilled,
  Menu as IconMenu,
  Cpu,
  Coin,
  Briefcase,
  User,
  ChatRound,
  Bottom,
  Top,
} from '@element-plus/icons-vue'
import { CENTERED_ALIGNMENT } from 'element-plus/es/components/virtual-list/src/defaults.mjs'
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
        active-text-color="#923408"
        background-color="#fffaf3"
        class="el-menu-vertical-demo"
        default-active="2"
        text-color="#191724"
        collapse-transition="false"
        close-on-click-outside="false"
        min-height:100vh
        @open="handleOpen"
        @close="handleClose"
      >
        <el-scrollbar>
          <el-row
            :align="Bottom"
            style="padding-top: 16px; padding-bottom: 24px"
          >
            <el-col :span="8">
              <el-divider direction="vertical" border-style="none" />
              <el-space>
                <el-avatar shape="square" :size="60" :src="squareUrl" />
              </el-space>
            </el-col>
            <el-col :span="16">
              <el-space direction="vertical" alignment="flex-start">
                <el-text
                  class="mx-1"
                  type="info"
                  size="small"
                  line-clamp="2"
                  style=""
                  >菜单默认100%高度，点击其他位置不收起菜单(两行时显示效果最佳)</el-text
                >
                <el-text class="mx-1" size="large" style=""
                  >姓名，对齐到底部</el-text
                >
              </el-space>
            </el-col>
          </el-row>
          <el-sub-menu index="1">
            <template #title>
              <el-icon><HomeFilled /></el-icon>
              <span>导航</span>
            </template>
            <el-menu-item index="1-1"><el-text>房间信息</el-text></el-menu-item>
            <el-menu-item index="1-2"><el-text>房间列表</el-text></el-menu-item>
            <el-menu-item index="1-3" disabled
              ><el-text>注册/编辑</el-text></el-menu-item
            >
            <el-menu-item index="1-4"><el-text>帮助</el-text></el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="2">
            <template #title>
              <el-icon><icon-menu /></el-icon>
              <span>板块</span>
            </template>
            <el-menu-item index="2-1"><el-text>搜索</el-text></el-menu-item>
            <el-menu-item index="2-2"><el-text>动态</el-text></el-menu-item>
            <el-menu-item index="2-3"><el-text>广场</el-text></el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="3">
            <template #title>
              <el-icon><Coin /></el-icon>
              <span>消费</span>
            </template>
            <el-menu-item index="3-1"><el-text>银行</el-text></el-menu-item>
            <el-menu-item index="3-2"><el-text>炒股</el-text></el-menu-item>
            <el-menu-item index="3-3"><el-text>骰子</el-text></el-menu-item>
            <el-menu-item index="3-4"><el-text>商城</el-text></el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="4">
            <template #title>
              <el-icon><Briefcase /></el-icon>
              <span>工具</span>
            </template>
            <el-menu-item index="4-1"><el-text>点播</el-text></el-menu-item>
            <el-menu-item index="4-2"><el-text>便签</el-text></el-menu-item>
            <el-menu-item index="4-3"><el-text>解析</el-text></el-menu-item>
            <el-menu-item index="4-4"><el-text>清屏</el-text></el-menu-item>
            <el-menu-item index="4-5"><el-text>隐式传送</el-text></el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="5">
            <template #title>
              <el-icon><Cpu /></el-icon>
              <span>系统</span>
            </template>
            <el-menu-item index="5-1"><el-text>设置</el-text></el-menu-item>
            <el-menu-item index="5-2"><el-text>关于</el-text></el-menu-item>
            <el-menu-item index="5-3"><el-text>重载</el-text></el-menu-item>
            <el-menu-item index="5-4"><el-text>登出</el-text></el-menu-item>
            <el-menu-item index="5-5"
              ><el-text>2019年4月29日13点23分</el-text></el-menu-item
            >
          </el-sub-menu>
          <el-sub-menu index="6">
            <template #title>
              <el-icon><User /></el-icon>
              <span>联系人</span>
            </template>
            <el-menu-item index="6-1">一个</el-menu-item>
            <el-menu-item index="6-2">一个</el-menu-item>
            <el-menu-item index="6-3">一个</el-menu-item>
            <el-menu-item index="6-4">一个</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="7">
            <template #title>
              <el-icon><ChatRound /></el-icon>
              <span>消息</span>
            </template>
            <el-menu-item index="7-1">一个</el-menu-item>
            <el-menu-item index="7-2">一个</el-menu-item>
            <el-menu-item index="7-3">一个</el-menu-item>
          </el-sub-menu>
        </el-scrollbar>
      </el-menu>
    </el-aside>
    <el-main>
      <el-scrollbar>
        <el-empty description=""></el-empty>
        <el-text>
          当你背单词时，阿拉斯加的鳕鱼正跃出水面。<br />
          当你解微分方程时，大洋彼岸的海鸥正拂过费城。<br />
          当你晚自习时，极图的夜空散满了五彩斑斓。<br />
          当你为自己的未来踏踏实实努力时， 那些你从未见过的风景，<br />
          那些你以为不会遇到的人， 你要的一切， 正一步步向你走来。<br />
        </el-text>
      </el-scrollbar>
    </el-main>
  </el-container>
</template>
<style></style>
