import { createRouter, createWebHistory } from 'vue-router'
import { useRouteStore } from '@/store/useRouteStore'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // 自动适配部署路径
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Auth/Login.vue'),
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Auth/Register.vue'),
    },
    {
      path: '/forgot',
      name: 'Forgot',
      component: () => import('@/views/Auth/Forgot.vue'),
    },
  
    {
      path: '/home',
      name: 'Home',
      component: () => import('@/views/Home/Home.vue'),
    },
   
    {
      path: '/',
      redirect: '/login'
    }
  ]
})
router.beforeEach((to, from, next) => {
  const isPlayerMode = import.meta.env.VITE_APP_MODE === 'player'
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  const routeStore = useRouteStore()
  routeStore.setPrevRoute(from.fullPath)

  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest

  if (requiresAuth && !token) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (requiresGuest && token) {
    return next({ name: 'Home' })
  } else {
    return next()
  }
})




export default router