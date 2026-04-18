import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, password) => {
        set({ loading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('token', data.token)
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
          return { success: true }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: error.response?.data?.error || 'Login failed' }
        }
      },

      register: async (userData) => {
        set({ loading: true })
        try {
          const { data } = await api.post('/auth/register', userData)
          localStorage.setItem('token', data.token)
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
          return { success: true }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: error.response?.data?.error || 'Registration failed' }
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      fetchMe: async () => {
        const token = localStorage.getItem('token')
        if (!token) return
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.user, isAuthenticated: true })
        } catch {
          localStorage.removeItem('token')
          set({ user: null, token: null, isAuthenticated: false })
        }
      }
    }),
    {
      name: 'curalink-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)

export default useAuthStore
