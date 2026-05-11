import axios from 'axios'
import { storage } from '../utils/storage'

// Use env variable — falls back to localhost for dev
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15s — accounts for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
})

// REQUEST INTERCEPTOR — automatically attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = storage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// RESPONSE INTERCEPTOR — handle auth errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      storage.clearAll()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance