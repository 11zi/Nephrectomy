import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: { template: '<div />' },
    },
    {
      path: '/ui-preview',
      name: 'ui-preview',
      component: { template: '<div />' },
    },
  ],
})

export default router
