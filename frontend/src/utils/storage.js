// Thin wrapper around localStorage — centralizes key names
const TOKEN_KEY = 'synapsecrm_token'
const USER_KEY  = 'synapsecrm_user'
const THEME_KEY = 'synapsecrm_theme'

export const storage = {
  getToken:    ()        => localStorage.getItem(TOKEN_KEY),
  setToken:    (token)   => localStorage.setItem(TOKEN_KEY, token),
  removeToken: ()        => localStorage.removeItem(TOKEN_KEY),

  getUser:     ()        => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  },
  setUser:     (user)    => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser:  ()        => localStorage.removeItem(USER_KEY),

  getTheme:    ()        => localStorage.getItem(THEME_KEY) || 'light',
  setTheme:    (theme)   => localStorage.setItem(THEME_KEY, theme),
  removeTheme: ()        => localStorage.removeItem(THEME_KEY),

  clearAll:    ()        => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    // Note: Theme is NOT cleared so user preference persists across sessions
  }
}