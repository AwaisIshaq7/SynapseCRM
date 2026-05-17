import axiosInstance from './axiosInstance'

export const emailApi = {
  getMailbox: (params = {}) =>
    axiosInstance.get('/emails/mailbox', { params }),

  getEmail: (id) =>
    axiosInstance.get(`/emails/${id}`),

  sync: (body = {}) =>
    axiosInstance.post('/emails/sync', body),

  reply: (payload) =>
    axiosInstance.post('/emails/reply', payload),

  getConfigStatus: () =>
    axiosInstance.get('/emails/config-status'),
}
