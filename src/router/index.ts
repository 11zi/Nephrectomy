import { createRouter, createWebHistory } from 'vue-router'
import SideBar from '../views/SideBar.vue'
import NephrectomyView from '../views/NephrectomyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/Nephrectomy',
      name: 'Nephrectomy',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: NephrectomyView,
    },
  ],
})

export default router
