<script setup lang="ts">
import { ref } from 'vue'
const isSideBarCollapsed = ref(false)
const component = [
  {
    name: '导航',
    vueSrc: '',
    child: [
      { name: '房间信息', vueSrc: '' },
      { name: '房间列表', vueSrc: '' },
      { name: '注册/编辑', vueSrc: '' },
      { name: '帮助', vueSrc: '' },
    ],
  },
  {
    name: '板块',
    vueSrc: '',
    child: [
      { name: '银行', vueSrc: '' },
      { name: '炒股', vueSrc: '' },
      { name: '骰子', vueSrc: '' },
      { name: '商城', vueSrc: '' },
    ],
  },
  {
    name: '工具',
    vueSrc: '',
    child: [
      { name: '点播', vueSrc: '' },
      { name: '便签', vueSrc: '' },
      { name: '解析', vueSrc: '' },
      { name: '吃饭', vueSrc: '' },
      { name: '隐式传送', vueSrc: '' },
    ],
  },
  {
    name: '系统',
    vueSrc: '',
    child: [
      { name: '设置', vueSrc: '' },
      { name: '关于', vueSrc: '' },
      { name: '重载', vueSrc: '' },
      { name: '登出', vueSrc: '' },
      { name: '2019年4月29日13点23分', vueSrc: '' },
    ],
  },
  { name: '好友', vueSrc: '' },
  { name: '消息', vueSrc: '' },
]
</script>

<template>
  <div class="mdui-drawer mdui-drawer-open mdui-color-blue-grey" swipe="true">
    <v-for></v-for>
    <ul class="mdui-list" mdui-collapse="{accordion: true}">
      <li class="mdui-list-item mdui-ripple">
        <i class="mdui-list-item-icon mdui-icon material-icons">home</i>
        <div class="mdui-list-item-content">Home</div>
      </li>

      <li class="mdui-list-item mdui-ripple">
        <i class="mdui-list-item-icon mdui-icon material-icons">dashboard</i>
        <div class="mdui-list-item-content">Dashboard</div>
      </li>

      <li class="mdui-collapse-item mdui-collapse-item-open">
        <div class="mdui-collapse-item-header mdui-list-item mdui-ripple">
          <i class="mdui-list-item-icon mdui-icon material-icons">people</i>
          <div class="mdui-list-item-content">Audience</div>
          <i class="mdui-collapse-item-arrow mdui-icon material-icons"
            >keyboard_arrow_down</i
          >
        </div>
        <ul class="mdui-collapse-item-body mdui-list mdui-list-dense">
          <li class="mdui-list-item mdui-ripple">Overview</li>
          <li class="mdui-list-item mdui-ripple">Language</li>
          <li class="mdui-list-item mdui-ripple">Location</li>
          <li class="mdui-list-item mdui-ripple">New vs Returning</li>
        </ul>
      </li>

      <li class="mdui-collapse-item">
        <div class="mdui-collapse-item-header mdui-list-item mdui-ripple">
          <i class="mdui-list-item-icon mdui-icon material-icons">device_hub</i>
          <div class="mdui-list-item-content">Acquisition</div>
          <i class="mdui-collapse-item-arrow mdui-icon material-icons"
            >keyboard_arrow_down</i
          >
        </div>
        <ul class="mdui-collapse-item-body mdui-list mdui-list-dense">
          <li class="mdui-list-item mdui-ripple">Overview</li>
          <li class="mdui-list-item mdui-ripple">All Traffic</li>
          <li class="mdui-list-item mdui-ripple">Direct Traffic</li>
          <li class="mdui-list-item mdui-ripple">Search Overview</li>
        </ul>
      </li>

      <li class="mdui-collapse-item">
        <div class="mdui-collapse-item-header mdui-list-item mdui-ripple">
          <i class="mdui-list-item-icon mdui-icon material-icons">touch_app</i>
          <div class="mdui-list-item-content">Behavior</div>
          <i class="mdui-collapse-item-arrow mdui-icon material-icons"
            >keyboard_arrow_down</i
          >
        </div>
        <ul class="mdui-collapse-item-body mdui-list mdui-list-dense">
          <li class="mdui-list-item mdui-ripple">Overview</li>
          <li class="mdui-list-item mdui-ripple">All Pages</li>
          <li class="mdui-list-item mdui-ripple">Landing Pages</li>
          <li class="mdui-list-item mdui-ripple">Exit Pages</li>
        </ul>
      </li>

      <li class="mdui-list-item mdui-ripple">
        <i class="mdui-list-item-icon mdui-icon material-icons"
          >shopping_cart</i
        >
        <div class="mdui-list-item-content">Ecommerce</div>
      </li>
    </ul>
  </div>
  <button class="mdui-btn mdui-color-theme-accent mdui-ripple">脱勾</button>
</template>

<style></style>
