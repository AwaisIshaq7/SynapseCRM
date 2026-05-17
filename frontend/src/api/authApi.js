import axiosInstance from './axiosInstance'

export const authApi = {
  login: (credentials) =>
    axiosInstance.post('/auth/login', credentials),

  register: (userData) =>
    axiosInstance.post('/auth/register', userData),

  getMe: () =>
    axiosInstance.get('/auth/me'),

  updatePreferences: (prefs) =>
    axiosInstance.put('/users/preferences', prefs),

  forgotPassword: (email) =>
    axiosInstance.post('/auth/forgot-password', { email }),

  resetPassword: (token, password, confirmPassword) =>
    axiosInstance.post(`/auth/reset-password/${token}`, { password, confirmPassword }),

  validateResetToken: (token) =>
    axiosInstance.get(`/auth/validate-reset/${token}`),

  changePassword: (currentPassword, newPassword, confirmPassword) =>
    axiosInstance.put('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
}