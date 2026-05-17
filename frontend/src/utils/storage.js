const TOKEN_KEY = 'synapsecrm_token'
const SESSION_TOKEN_KEY = 'synapsecrm_session_token'
const USER_KEY = 'synapsecrm_user'
const THEME_KEY = 'synapsecrm_theme'
const REMEMBER_KEY = 'synapsecrm_remember_me'
const SAVED_EMAIL_KEY = 'synapsecrm_saved_email'
const RECENT_KEY = 'synapsecrm_recent_customers'
const CUSTOMER_FILTERS_KEY = 'synapsecrm_customer_filters'
const FORM_DRAFT_KEY = 'synapsecrm_customer_draft'
const MAX_RECENT = 5

export const storage = {
  getRememberMe: () => localStorage.getItem(REMEMBER_KEY) === 'true',

  setRememberMe: (remember, email = '') => {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
    if (remember && email) {
      localStorage.setItem(SAVED_EMAIL_KEY, email)
    }
    if (!remember) {
      localStorage.removeItem(SAVED_EMAIL_KEY)
    }
  },

  getSavedEmail: () => localStorage.getItem(SAVED_EMAIL_KEY) || '',

  getToken: () => {
    const persistent = localStorage.getItem(TOKEN_KEY)
    if (persistent) return persistent
    return sessionStorage.getItem(SESSION_TOKEN_KEY)
  },

  setToken: (token, remember = true) => {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token)
      sessionStorage.removeItem(SESSION_TOKEN_KEY)
    } else {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token)
      localStorage.removeItem(TOKEN_KEY)
    }
  },

  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  },

  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setUser: (user, remember = true) => {
    const json = JSON.stringify(user)
    if (remember) {
      localStorage.setItem(USER_KEY, json)
      sessionStorage.removeItem(USER_KEY)
    } else {
      sessionStorage.setItem(USER_KEY, json)
      localStorage.removeItem(USER_KEY)
    }
  },

  removeUser: () => {
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(USER_KEY)
  },

  getTheme: () => localStorage.getItem(THEME_KEY) || 'light',
  setTheme: (theme) => localStorage.setItem(THEME_KEY, theme),
  removeTheme: () => localStorage.removeItem(THEME_KEY),

  clearAll: () => {
    storage.removeToken()
    storage.removeUser()
  },

  getRecentCustomers: () => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || []
    } catch {
      return []
    }
  },
  addRecentCustomer: (customer) => {
    if (!customer?._id && !customer?.id) return
    const id = customer._id || customer.id
    const entry = { id, name: customer.name, viewedAt: new Date().toISOString() }
    const list = storage.getRecentCustomers().filter((c) => c.id !== id)
    list.unshift(entry)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
  },

  getCustomerFilters: () => {
    try {
      return JSON.parse(sessionStorage.getItem(CUSTOMER_FILTERS_KEY)) || null
    } catch {
      return null
    }
  },
  setCustomerFilters: (filters) => {
    sessionStorage.setItem(CUSTOMER_FILTERS_KEY, JSON.stringify(filters))
  },

  getCustomerDraft: () => {
    try {
      return JSON.parse(localStorage.getItem(FORM_DRAFT_KEY)) || null
    } catch {
      return null
    }
  },
  setCustomerDraft: (data) => {
    if (!data) localStorage.removeItem(FORM_DRAFT_KEY)
    else localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(data))
  },
}
