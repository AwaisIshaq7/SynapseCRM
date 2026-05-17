import axiosInstance from './axiosInstance'

export const usersApi = {
  getAllUsers: () =>
    axiosInstance.get('/users'),

  deleteUser: (userId) =>
    axiosInstance.delete(`/users/${userId}`),

  sendAdminMessage: (userId, message) =>
    axiosInstance.post(`/users/${userId}/message`, { message }),

  updatePreferences: (prefs) =>
    axiosInstance.put('/users/preferences', prefs),
    // prefs: { theme, widgetOrder }

  logUsage: (widgetName) =>
    axiosInstance.put('/users/usage-log', { widgetName }),
}