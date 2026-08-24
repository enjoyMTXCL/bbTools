import { createRouter, createWebHistory } from 'vue-router'

// 路由懒加载：按需加载页面组件，加快首屏速度
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/home/index.vue')
    },
    {
      path: '/typeIn',
      name: 'typeIn',
      component: () => import('../views/data/typeIn.vue')
    },
    {
      path: '/battle',
      name: 'battle',
      component: () => import('../views/analysis/battle.vue')
    },
    {
      path: '/level',
      name: 'level',
      component: () => import('../views/analysis/level.vue')
    },
    {
      path: '/help',
      name: 'Help',
      component: () => import('../views/about/help.vue')
    }
  ]
})

export default router
