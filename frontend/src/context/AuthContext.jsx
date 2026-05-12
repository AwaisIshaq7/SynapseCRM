import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'
import { storage } from '../utils/storage'

const AuthContext = createContext(null)
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@synapsecrm.local',
  role: 'admin',
  preferences: {
    theme: storage.getTheme() || 'light',
  },
}

const createDemoSession = (setUser, setToken) => {
  storage.setUser(DEMO_USER)
  storage.setToken('demo-token')
  setUser(DEMO_USER)
  setToken('demo-token')
}

const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export function AuthProvider({ children }) {
  const storedUser = storage.getUser()
  // Don't restore demo users from storage
  const initialUser = storedUser?.id === 'demo-user' ? null : storedUser
  const [user, setUser]       = useState(initialUser)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true) // true until we verify token

  const applyTheme = useCallback((theme) => {
    applyThemeToDocument(theme)
    storage.setTheme(theme)
  }, [])

  // On mount — verify stored token is still valid
  useEffect(() => {
    const verifyToken = async () => {
      // Demo mode disabled - always require login
      // if (DEMO_MODE) {
      //   storage.setUser(DEMO_USER)
      //   storage.setToken('demo-token')
      //   setUser(DEMO_USER)
      //   setToken('demo-token')
      //   setLoading(false)
      //   return
      // }

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
  }, [user, applyTheme])

  const login = useCallback(async (credentials) => {
    // if (DEMO_MODE) {
    //   createDemoSession(setUser, setToken)
    //   return { success: true }
    // }

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
    if (DEMO_MODE) {
      createDemoSession(setUser, setToken)
      return { success: true }
    }

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
    if (DEMO_MODE) {
      createDemoSession(setUser, setToken)
      return
    }

    storage.clearAll()
    setUser(null)
    setToken(null)
  }, [])

  const updateUserPreferences = useCallback((prefs) => {
    const updated = { ...user, preferences: { ...user?.preferences, ...prefs } }
    setUser(updated)
    storage.setUser(updated)
    if (prefs.theme) applyTheme(prefs.theme)
  }, [user, applyTheme])

  const loginAsDemo = useCallback(() => {
    createDemoSession(setUser, setToken)
    return { success: true }
  }, [])

  const theme = user?.preferences?.theme || storage.getTheme() || 'light'

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    updateUserPreferences({ theme: nextTheme })
    return nextTheme
  }, [theme, updateUserPreferences])

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
      loginAsDemo,
      isAdmin,
      isSalesManager,
      theme,
      toggleTheme,
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