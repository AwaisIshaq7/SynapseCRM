import axiosInstance from './axiosInstance'

export const usersApi = {
  getAllUsers: () =>
    axiosInstance.get('/users'),

  deleteUser: (userId) =>
    axiosInstance.delete(`/users/${userId}`),

  updatePreferences: (prefs) =>
    axiosInstance.put('/users/preferences', prefs),
    // prefs: { theme, widgetOrder }

  logUsage: (widgetName) =>
    axiosInstance.put('/users/usage-log', { widgetName }),
}