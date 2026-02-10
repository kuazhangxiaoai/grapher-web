import axios from 'axios'
import message from '@/utils/message'
import router from '@/router';
const instance = axios.create({ timeout: 1000 * 300 })
// 请求拦截器：添加 Authorization 头
instance.interceptors.request.use(
  config => {
    // 从 localStorage、sessionStorage 或其他存储中获取 Token
    const token = (localStorage.getItem('token')) || sessionStorage.getItem('token'); // 根据你的实际存储方式调整
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // 添加 Authorization 头，格式根据后端要求调整
    } else {
      console.warn('No token found, request sent without Authorization header');
      // 可选：如果需要登录，可跳转到登录页
    }
    config.headers['x-client-type'] = `ppt`;
    return config;
  },
  error => {
    message.error('请求配置失败！');
    return Promise.reject(error);
  }
);
instance.interceptors.response.use(
  (response:any) => {
    if (response.status >= 200 && response.status < 400) {
      // 检查 resultCode 和 code 判断请求是否成功
      const isSuccess = response.data.resultCode === "0000" || response.data.code === 200;
      if (!isSuccess) {
        const errorMsg = response.data.resultMsg || response.data.msg || '请求处理失败';
        message.error(errorMsg);
        if (response.data.code === 401) {
          localStorage.clear();
          sessionStorage.clear();
          router.push('/login'); // 跳转到登录页面，或者其他处理逻辑，如弹出提示或跳转到登录页等。
        }
        return Promise.reject(response.data);
      }
      return Promise.resolve(response.data);
    }

    message.error('未知的请求错误！');
    return Promise.reject(response);
  },
  error => {
    if (error && error.response) {
      if (error.response.status >= 400 && error.response.status < 500) {
        return Promise.reject(error.message)
      }
      else if (error.response.status >= 500) {
        return Promise.reject(error.message)
      }

      message.error('服务器遇到未知错误！')
      return Promise.reject(error.message)
    }
    message.error('连接到服务器失败 或 服务器响应超时！')
    return Promise.reject(error)
  }
)

export default instance
