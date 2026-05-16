import axiosInstance from './axiosInstance'

export const dashboardApi = {
  getSummary: () =>
    axiosInstance.get('/dashboard/summary'),

  getSentimentTrend: (days = 7) =>
    axiosInstance.get('/dashboard/sentiment-trend', { params: { days } }),

  getChurnDistribution: () =>
    axiosInstance.get('/dashboard/churn-distribution'),

  getAdminOverview: () =>
    axiosInstance.get('/dashboard/admin-overview'),
}