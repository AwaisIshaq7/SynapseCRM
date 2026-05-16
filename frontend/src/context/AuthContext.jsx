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
  // Initialize theme from localStorage, but only apply if user is authenticated
  const [theme, setTheme]     = useState(storage.getTheme())
  const [loading, setLoading] = useState(true) // true until we verify token

  // Apply theme to document only when user is authenticated (not on login/register pages)
  useEffect(() => {
    if (user) {
      applyThemeToDocument(theme)
    } else {
      // Keep login/register pages in light mode
      applyThemeToDocument('light')
    }
  }, [theme, user])

  const applyTheme = useCallback((nextTheme) => {
    applyThemeToDocument(nextTheme)
    storage.setTheme(nextTheme)
    setTheme(nextTheme)
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
        // No token - theme already applied from localStorage via state init
        setLoading(false)
        return
      }
      try {
        const res = await authApi.getMe()
        if (res.data.success) {
          setUser(res.data.data)
          storage.setUser(res.data.data)
          // Sync theme from backend user preferences (if available)
          const userTheme = res.data.data?.preferences?.theme
          if (userTheme) {
            applyTheme(userTheme)
          }
        }
      } catch {
        // Token invalid — clear everything
        storage.clearAll()
        setUser(null)
        setToken(null)
        // Keep the stored theme preference even after logout
        const storedTheme = storage.getTheme()
        setTheme(storedTheme)
      } finally {
        setLoading(false)
      }
    }
    verifyToken()
  }, [])

  // When user preferences change, sync theme to storage
  useEffect(() => {
    if (user?.preferences?.theme) {
      storage.setTheme(user.preferences.theme)
    }
  }, [user?.preferences?.theme])

  const login = useCallback(async (credentials) => {
    // if (DEMO_MODE) {
    //   createDemoSession(setUser, setToken)
    //   return { success: true }
    // }

    try {
      const res = await authApi.login(credentials)
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data.data
        storage.setToken(newToken)
        storage.setUser(newUser)
        setToken(newToken)
        setUser(newUser)
        // Apply theme from user preferences or fallback to stored theme
        const userTheme = newUser?.preferences?.theme || storage.getTheme()
        applyTheme(userTheme)
        return { success: true }
      }
      return { success: false, error: res.data.error }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Login failed',
      }
    }
  }, [applyTheme])

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
      // Apply theme from user preferences or fallback to stored theme
      const userTheme = newUser?.preferences?.theme || storage.getTheme()
      applyTheme(userTheme)
      return { success: true }
    }
    return { success: false, error: res.data.error }
  }, [applyTheme])

  const logout = useCallback(() => {
    if (DEMO_MODE) {
      createDemoSession(setUser, setToken)
      return
    }

    storage.clearAll()
    setUser(null)
    setToken(null)
    // Preserve user's theme preference even after logout
    const storedTheme = storage.getTheme()
    setTheme(storedTheme)
  }, [])

  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await authApi.forgotPassword(email)
      if (res.data.success) {
        return { success: true, message: res.data.data?.message || res.data.message }
      }
      return { success: false, error: res.data.error }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  const resetPassword = useCallback(async (token, password, confirmPassword) => {
    try {
      const res = await authApi.resetPassword(token, password, confirmPassword)
      if (res.data.success) {
        return { success: true, message: res.data.data?.message || res.data.message }
      }
      return { success: false, error: res.data.error }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    try {
      const res = await authApi.changePassword(currentPassword, newPassword, confirmPassword)
      if (res.data.success) {
        return { success: true, message: res.data.message }
      }
      return { success: false, error: res.data.error }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  const updateUserPreferences = useCallback(async (prefs) => {
    try {
      // Update local state immediately
      const updated = { ...user, preferences: { ...user?.preferences, ...prefs } }
      setUser(updated)
      storage.setUser(updated)
      
      // Apply theme immediately if changing
      if (prefs.theme) {
        applyTheme(prefs.theme)
      }
      
      // Sync with backend (fire and forget with error handling)
      const res = await authApi.updatePreferences(prefs)
      if (res.data.success) {
        // Backend confirmed - update stored user with backend response
        const updated = { ...user, preferences: { ...user?.preferences, ...res.data.data } }
        storage.setUser(updated)
      }
    } catch (err) {
      console.error('Failed to update preferences:', err)
      // Preferences still applied locally, just log the backend error
    }
  }, [user, applyTheme])



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
      forgotPassword,
      resetPassword,
      changePassword,
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
