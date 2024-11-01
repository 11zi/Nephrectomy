<script setup lang="ts">
import { reactive, toRefs } from 'vue'
const state = reactive({
  circleUrl:
    'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  squareUrl:
    'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
  sizeList: ['small', '', 'large'] as const,
})

const { squareUrl } = toRefs(state)
import {
  HomeFilled,
  Menu as IconMenu,
  Cpu,
  Coin,
  Briefcase,
  User,
  ChatRound,
  Bottom,
  ElementPlus,
} from '@element-plus/icons-vue'

// 保留，每个子菜单打开关闭时触发
const handleOpen = (key: string, keyPath: string[]) => {}
const handleClose = (key: string, keyPath: string[]) => {}

// 控制侧边栏收起展开
import { ref } from 'vue'
const isCollapse = ref(false)
const side_bar_width = ref(300)
function toggleCollapse() {
  if (isCollapse.value) {
    isCollapse.value = false
    side_bar_width.value = 300
  } else {
    isCollapse.value = true
    side_bar_width.value = 0
  }
}
</script>

<template>
  <el-aside :style="{ width: side_bar_width + 'px' }">
    <el-menu
      active-text-color="#923408"
      background-color="#fffaf3"
      text-color="#191724"
      :collapse="isCollapse"
      collapse-transition="false"
      @open="handleOpen"
      @close="handleClose"
      style="height: 100%"
    >
      <el-scrollbar>
        <el-row :align="Bottom" style="padding-top: 16px; padding-bottom: 24px">
          <el-col :span="8">
            <el-space boxShadow="--el-box-shadow">
              <el-divider direction="vertical" border-style="none"></el-divider>
              <el-avatar
                v-model="isCollapse"
                shape="square"
                :size="60"
                :src="squareUrl"
              />
            </el-space>
          </el-col>
          <el-col :span="16">
            <el-space
              direction="vertical"
              alignment="flex-start"
              style="
                height: 100%;
                justify-content: space-between;
                padding-right: 8px;
              "
            >
              <el-text class="mx-1" type="info" size="small" line-clamp="2"
                >凡是被那把武器伤害的人，都会遭到席卷全身的诅咒</el-text
              >
              <el-text class="mx-1" size="large">哈米斯基</el-text>
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
          <el-menu-item index="4-4"><el-text>吃饭</el-text></el-menu-item>
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
            <span>好友</span>
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
  <el-affix :offset="8" style="margin-left: 8px">
    <el-button :icon="ElementPlus" @click="toggleCollapse" circle></el-button
  ></el-affix>
</template>

<style>
:deep(.el-submenu .el-menu-item) {
  min-width: 0px !important;
}
.el-menu--collapse {
  width: 2px !important;
}
.el-aside {
  width: 4px;
}
</style>
