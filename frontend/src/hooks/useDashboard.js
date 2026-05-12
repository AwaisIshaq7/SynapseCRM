import { useState, useEffect } from 'react'
import { dashboardApi } from '../api/dashboardApi'

export function useDashboard() {
  const [summary,       setSummary]       = useState(null)
  const [sentimentTrend, setSentimentTrend] = useState(null)
  const [churnDist,     setChurnDist]     = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [summaryRes, trendRes, churnRes] = await Promise.allSettled([
          dashboardApi.getSummary(),
          dashboardApi.getSentimentTrend(7),
          dashboardApi.getChurnDistribution(),
        ])

        if (summaryRes.status === 'fulfilled' && summaryRes.value.data.success) {
          setSummary(summaryRes.value.data.data)
        }
        if (trendRes.status === 'fulfilled' && trendRes.value.data.success) {
          setSentimentTrend(trendRes.value.data.data)
        }
        if (churnRes.status === 'fulfilled' && churnRes.value.data.success) {
          setChurnDist(churnRes.value.data.data)
        }
      } catch {
        setError('Dashboard data unavailable')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return { summary, sentimentTrend, churnDist, loading, error }
}