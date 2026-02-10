import type {  RegisterData } from '@/views/Auth/auth.ts';
import axios from './config' // 导入 axios 实例并进行配置，如设置拦截器、超时等设置，参考 config.ts 文件中的 setu
export default {
    login(credentials:FormData): Promise<any> {
        return axios.post(`/serve_api/user/login`,credentials)
    },
    register(userData: RegisterData): Promise<any> {
        return axios.post(`/serve_api/user/register`,userData)
    },
    logout(): Promise<any> {
        return axios.post(`/serve_api/user/logout`)
    },
    getUserInfo(token:string): Promise<any> {
        return axios.get(`/serve_api/user/getUserInfo/?token=${token}`) 
    }
}
