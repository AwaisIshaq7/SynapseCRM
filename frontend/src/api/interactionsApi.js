import axiosInstance from './axiosInstance'

export const interactionsApi = {
  getByCustomer: (customerId, params = {}) =>
    axiosInstance.get(`/customers/${customerId}/interactions`, { params }),

  create: (customerId, data) =>
    axiosInstance.post(`/customers/${customerId}/interactions`, data),

  delete: (interactionId) =>
    axiosInstance.delete(`/interactions/${interactionId}`),
}