// Thin wrapper around Web Storage — centralizes key names and auth persistence mode
const TOKEN_KEY = 'synapsecrm_token'
const USER_KEY = 'synapsecrm_user'
const THEME_KEY = 'synapsecrm_theme'
const AUTH_MODE_KEY = 'synapsecrm_auth_mode'

const getAuthStorage = () => {
  const authMode = localStorage.getItem(AUTH_MODE_KEY)

  if (authMode === 'session') return sessionStorage
  if (authMode === 'local') return localStorage

  return sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(USER_KEY)
    ? sessionStorage
    : localStorage
}

const readUser = (storage) => {
  try {
    return JSON.parse(storage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export const storage = {
  getToken: () => {
    const authMode = localStorage.getItem(AUTH_MODE_KEY)

    if (authMode === 'session') return sessionStorage.getItem(TOKEN_KEY)
    if (authMode === 'local') return localStorage.getItem(TOKEN_KEY)

    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  },

  setToken: (token) => getAuthStorage().setItem(TOKEN_KEY, token),
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },

  getUser: () => {
    const authMode = localStorage.getItem(AUTH_MODE_KEY)

    if (authMode === 'session') return readUser(sessionStorage)
    if (authMode === 'local') return readUser(localStorage)

    return readUser(sessionStorage) || readUser(localStorage)
  },

  setUser: (user) => getAuthStorage().setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => {
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(USER_KEY)
  },

  setAuthMode: (rememberMe) => {
    localStorage.setItem(AUTH_MODE_KEY, rememberMe ? 'local' : 'session')
  },

  clearAuthMode: () => localStorage.removeItem(AUTH_MODE_KEY),

  getTheme: () => localStorage.getItem(THEME_KEY) || 'light',
  setTheme: (theme) => localStorage.setItem(THEME_KEY, theme),
  removeTheme: () => localStorage.removeItem(THEME_KEY),

  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(AUTH_MODE_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    // Note: Theme is NOT cleared so user preference persists across sessions
  },
}