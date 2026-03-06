<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import BaseCard from './Card/BaseCard.vue'

const components = [
  {
    name: '导航',
    vueSrc: '',
    index: '1',
    icon: 'home',
    child: [
      { name: '房间信息', vueSrc: '', index: '1-1', icon: 'class' },
      { name: '房间列表', vueSrc: '', index: '1-2', icon: 'map' },
      { name: '注册/编辑', vueSrc: '', index: '1-3', icon: 'exit_to_app' },
      { name: '帮助', vueSrc: '', index: '1-4', icon: 'help_outline' },
    ],
  },
  {
    name: '板块',
    vueSrc: '',
    index: '2',
    icon: 'widgets',
    child: [
      { name: '银行', vueSrc: '', index: '2-1', icon: 'account_balance' },
      { name: '炒股', vueSrc: '', index: '2-2', icon: 'timeline' },
      { name: '骰子', vueSrc: '', index: '2-3', icon: 'money_off' },
      { name: '商城', vueSrc: '', index: '2-4', icon: 'add_shopping_cart' },
    ],
  },
  {
    name: '工具',
    vueSrc: '',
    index: '3',
    icon: 'gavel',
    child: [
      { name: '点播', vueSrc: '', index: '3-1', icon: 'playlist_play' },
      { name: '便签', vueSrc: '', index: '3-2', icon: 'note' },
      {
        name: '解析',
        vueSrc: '../Card/BaseCard.vue',
        index: '3-3',
        icon: 'sd_card',
      },
      { name: '吃饭', vueSrc: '', index: '3-4', icon: 'restaurant_menu' },
      { name: '时间', vueSrc: '', index: '3-6', icon: 'access_time' },
      { name: '隐式传送', vueSrc: '', index: '3-5', icon: 'blur_on' },
    ],
  },
  { name: '好友', vueSrc: '', index: '4', icon: 'account_box', child: [] },
  { name: '消息', vueSrc: '', index: '5', icon: 'message', child: [] },
  {
    name: '系统',
    vueSrc: '',
    index: '6',
    icon: 'settings',
    child: [
      { name: '设置', vueSrc: '', index: '6-1', icon: 'settings' },
      { name: '关于', vueSrc: '', index: '6-2', icon: 'info_outline' },
      { name: '重载', vueSrc: '', index: '6-3', icon: 'refresh' },
      { name: '登出', vueSrc: '', index: '6-4', icon: 'exit_to_app' },
    ],
  },
]

const isSidebarOpen = ref(false)
// isActive：记录每个面板是否打开
// stackIndex：记录每个面板打开时分配到的层叠序号
const isActive = ref<Record<string, boolean>>({})
const stackIndexMap = ref<Record<string, number>>({})
// 累计打开过多少个面板，用于计算偏移；关闭不重置，再次打开时继续递增
let openCount = 0

const sidebarClass = ref([
  'mdui-drawer',
  `mdui-drawer-${isSidebarOpen.value ? 'open' : 'close'}`,
  'mdui-color-blue-grey',
])
const sidebar = ref(null)

onClickOutside(sidebar, closeSideBar)
for (const item of components) {
  for (const _item of item.child) {
    isActive.value[_item.name] = false
    stackIndexMap.value[_item.name] = 0
  }
}

function openSideBar() {
  isSidebarOpen.value = true
  document.body.style.paddingLeft = '240px'
  sidebarClass.value[1] = `mdui-drawer-open`
}
function closeSideBar() {
  isSidebarOpen.value = false
  document.body.style.paddingLeft = '0px'
  sidebarClass.value[1] = `mdui-drawer-close`
  mdui.mutation()
}

/**
 * 打开插件面板
 * @param panelName 插件名
 * @param panelPath 插件路径
 */
function openPanel(panelName: string, _panelPath: string) {
  if (!isActive.value[panelName]) {
    // 每次新打开时分配新的层叠序号
    stackIndexMap.value[panelName] = openCount
    openCount++
  }
  isActive.value[panelName] = true
}
function closePanel(panelName: string) {
  isActive.value[panelName] = false
}
</script>

<template>
  <div
    style="height: 100%; width: 1px; position: absolute; left: 0px"
    @mouseenter="openSideBar"
  ></div>
  <div>
    <div v-for="item in components" :key="item.index">
      <div v-for="_item in item.child" :key="_item.index">
        <component
          v-if="isActive[_item.name]"
          :is="BaseCard"
          @closePanel="closePanel(_item.name)"
          :panelName="_item.name"
          :stackIndex="stackIndexMap[_item.name]"
        ></component>
      </div>
    </div>
  </div>
  <div :class="sidebarClass" ref="sidebar" swipe="true" overlay="true">
    <div class="mdui-container mdui-p-a-2">
      <div class="mdui-row">
        <img
          src="../assets/static_image/r19.png"
          alt="avatar"
          class="mdui-img-rounded mdui-shadow-2"
          style="position: absolute"
          width="80"
          height="80"
        />
        <div
          class="mdui-col-sm-7 mdui-col-offset-sm-5 mdui-col-xs-8 mdui-col-offset-xs-4"
          style="height: 100%"
        >
          <div
            class="mdui-list-item-two-line mdui-typo-caption noselect"
            style="
              font-weight: 200;
              opacity: 87%;
              padding-top: 2px;
              white-space: normal;
            "
          >
            凡是被那把武器伤害的人，都会遭到席卷全身的诅咒
          </div>
          <div
            class="mdui-typo-title mdui-p-t-2 noselect"
            style="font-weight: 400"
          >
            哈米斯基
          </div>
        </div>
      </div>
    </div>
    <ul class="mdui-list" v-for="item in components" :key="item.index">
      <li></li>
      <li class="mdui-subheader noselect">
        <i class="mdui-icon material-icons mdui-m-r-1">{{ item.icon }}</i>
        {{ item.name }}
      </li>
      <li
        class="mdui-list-item mdui-ripple"
        v-for="_item in item.child"
        :key="_item.index"
        @click="openPanel(_item.name, _item.vueSrc)"
      >
        &nbsp;&nbsp;&nbsp;&nbsp;
        <div class="mdui-list-item-content">
          <i class="mdui-list-item-icon mdui-icon material-icons mdui-m-r-1">{{
            _item.icon
          }}</i>
          {{ _item.name }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style>
.noselect {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
