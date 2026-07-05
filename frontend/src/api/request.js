import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器：自动携带 token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => response.data,
  error => {
    const status = error.response?.status
    const msg = error.response?.data?.message || error.message || '请求失败'

    // 401: 未登录或 token 过期
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('currentFamily')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    }
    // 403: 无权限
    else if (status === 403) {
      ElMessage.error('没有权限执行此操作')
    }
    // 429: 请求过于频繁
    else if (status === 429) {
      ElMessage.warning('请求过于频繁，请稍后再试')
    }
    // 500+: 服务器错误
    else if (status >= 500) {
      ElMessage.error('服务器开小差了，请稍后再试')
    }
    // 网络错误
    else if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络')
    }
    // 其他错误（非 silent 模式才提示）
    else if (!error.config?.silent) {
      ElMessage.error(msg)
    }

    return Promise.reject(error)
  }
)

export default request
