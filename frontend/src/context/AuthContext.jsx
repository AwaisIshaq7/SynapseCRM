import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(storage.getUser()) // hydrate from localStorage
  const [token, setToken]     = useState(storage.getToken())
  const [loading, setLoading] = useState(true) // true until we verify token

  // On mount — verify stored token is still valid
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = storage.getToken()
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const res = await authApi.getMe()
        if (res.data.success) {
          setUser(res.data.data)
          storage.setUser(res.data.data)
        }
      } catch {
        // Token invalid — clear everything
        storage.clearAll()
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [])

  // Apply dark/light theme from user preferences
  useEffect(() => {
    const theme = user?.preferences?.theme || storage.getTheme() || 'light'
    applyTheme(theme)
  }, [user])

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    storage.setTheme(theme)
  }

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials)
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data
      storage.setToken(newToken)
      storage.setUser(newUser)
      setToken(newToken)
      setUser(newUser)
      return { success: true }
    }
    return { success: false, error: res.data.error }
  }, [])

  const register = useCallback(async (userData) => {
    const res = await authApi.register(userData)
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data
      storage.setToken(newToken)
      storage.setUser(newUser)
      setToken(newToken)
      setUser(newUser)
      return { success: true }
    }
    return { success: false, error: res.data.error }
  }, [])

  const logout = useCallback(() => {
    storage.clearAll()
    setUser(null)
    setToken(null)
  }, [])

  const updateUserPreferences = useCallback((prefs) => {
    const updated = { ...user, preferences: { ...user?.preferences, ...prefs } }
    setUser(updated)
    storage.setUser(updated)
    if (prefs.theme) applyTheme(prefs.theme)
  }, [user])

  const isAdmin = user?.role === 'admin'
  const isSalesManager = user?.role === 'sales_manager'

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAdmin,
      isSalesManager,
      updateUserPreferences,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}