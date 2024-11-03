<script setup lang="ts">
import { ref } from 'vue'
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
      { name: '解析', vueSrc: '', index: '3-3', icon: 'sd_card' },
      { name: '吃饭', vueSrc: '', index: '3-4', icon: 'restaurant_menu' },
      {
        name: '时间',
        vueSrc: '',
        index: '3-6',
        icon: 'access_time',
      },
      { name: '隐式传送', vueSrc: '', index: '3-5', icon: 'blur_on' },
    ],
  },
  { name: '好友', vueSrc: '', index: '4', icon: 'account_box' },
  { name: '消息', vueSrc: '', index: '5', icon: 'message' },
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
</script>

<template>
  <div
    class="mdui-drawer mdui-drawer-open mdui-color-blue-grey"
    id="collapse"
    swipe="true"
    overlay="true"
  >
    <ul class="mdui-list" v-for="item in components" :key="item.index">
      <li></li>
      <li class="mdui-subheader">
        {{ item.name }}
        <i class="mdui-icon material-icons">{{ item.icon }}</i>
      </li>
      <li
        class="mdui-list-item mdui-ripple"
        v-for="_item in item.child"
        :key="_item.index"
      >
        &nbsp;&nbsp;&nbsp;&nbsp;
        <div class="mdui-list-item-content">
          {{ _item.name }}
          <i class="mdui-list-item-icon mdui-icon material-icons">{{
            _item.icon
          }}</i>
        </div>
      </li>
    </ul>
  </div>
</template>

<style></style>
