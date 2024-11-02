// 负责注册所有必须的组件
// 组件有限，所以一个一个注册
// 其实注册的是路由

import { createRouter, createWebHistory } from 'vue-router'

const plugin = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [],
})

export default plugin
