// store/useRouteStore.ts
import { defineStore } from 'pinia'

export const useGraphStore = defineStore('editStore', {
    state: () => ({
        totalPages: 1 as number, // 文档页数
        currentPage: 1 as number, //当前页

    }),
    actions: {
        setPrevRoute(path: string) {
            this.prevRoute = path
        },
    },
})
