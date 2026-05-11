import axiosInstance from './axiosInstance'

export const interactionsApi = {
  getByCustomer: (customerId) =>
    axiosInstance.get(`/customers/${customerId}/interactions`),

  create: (customerId, data) =>
    axiosInstance.post(`/customers/${customerId}/interactions`, data),

  delete: (interactionId) =>
    axiosInstance.delete(`/interactions/${interactionId}`),
}