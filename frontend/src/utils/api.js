import axios from 'axios'

// Default API instance — 30s timeout for normal routes
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// AI-specific API instance — 180s timeout for local LLM calls
export const apiAI = axios.create({
  baseURL: '/api',
  timeout: 300000,
  headers: { 'Content-Type': 'application/json' }
})

// Shared request interceptor: attach auth token
function attachToken(config) {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}

// Shared response interceptor: handle 401
function handle401(error) {
  if (error.response?.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
  return Promise.reject(error)
}

api.interceptors.request.use(attachToken)
api.interceptors.response.use((r) => r, handle401)

apiAI.interceptors.request.use(attachToken)
apiAI.interceptors.response.use((r) => r, handle401)

export default api
