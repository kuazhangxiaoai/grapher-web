import { createProdMockServer } from 'vite-plugin-mock/client'

// 导入所有mock模块
const modules = import.meta.glob('./modules/**/*.ts', { eager: true })

const mockModules: any[] = []
Object.keys(modules).forEach((key) => {
  if (modules[key] && typeof modules[key] === 'object' && 'default' in modules[key]) {
    mockModules.push(...(modules[key] as any).default)
  }
})

export function setupProdMockServer() {
  createProdMockServer(mockModules)
}

export default mockModules
