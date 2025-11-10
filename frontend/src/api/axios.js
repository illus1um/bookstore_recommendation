import axios from 'axios'
import { authStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 15000)

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
})

axiosInstance.interceptors.request.use(
  (config) => {
    const { token } = authStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = authStore.getState()
      logout()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance

