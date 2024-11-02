import { createRouter, createWebHistory } from 'vue-router'
import plugin from './neph-plugin.ts'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [],
})

export default router
