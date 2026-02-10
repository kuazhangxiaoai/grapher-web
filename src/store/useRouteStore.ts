// store/useRouteStore.ts
import { defineStore } from 'pinia'

export const useRouteStore = defineStore('route', {
  state: () => ({
    prevRoute: '', // 存储上一个路由路径
  }),
  actions: {
    setPrevRoute(path: string) {
      this.prevRoute = path
    },
  },
})
