import axiosInstance from './axiosInstance'

export const customersApi = {
  getAll: (params = {}) =>
    axiosInstance.get('/customers', { params }),
    // params: { status, search } — e.g. { status: 'at_risk', search: 'ahmed' }

  getById: (id) =>
    axiosInstance.get(`/customers/${id}`),

  create: (data) =>
    axiosInstance.post('/customers', data),

  update: (id, data) =>
    axiosInstance.put(`/customers/${id}`, data),

  delete: (id) =>
    axiosInstance.delete(`/customers/${id}`),

  analyzeEmails: (id) =>
    axiosInstance.post(`/customers/${id}/analyze-emails`),

  getSuggestedResponse: (id) =>
    axiosInstance.get(`/customers/${id}/suggested-response`),

  getPriorityInbox: () =>
    axiosInstance.get('/customers/priority-inbox'),
}