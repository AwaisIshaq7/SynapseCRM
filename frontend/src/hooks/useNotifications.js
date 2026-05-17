import { useState, useEffect, useCallback, useRef } from 'react'
import { storage } from '../utils/storage'
import toast from 'react-hot-toast'

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || '/api'
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('synapsecrm-zeta')) &&
      url === '/api') {
    url = 'https://synapsecrm-backend.onrender.com/api'
  }
  return url
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef(null)

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    const token = storage.getToken()
    if (!token) return

    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const resData = await response.json()
      if (resData.success) {
        setNotifications(resData.data)
        setUnreadCount(resData.data.filter(n => !n.read).length)
      }
    } catch (error) {
      console.error('Failed to fetch initial notifications:', error)
    }
  }, [])

  // Mark specific notification as read
  const markAsRead = useCallback(async (notificationId) => {
    const token = storage.getToken()
    if (!token) return

    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/notifications/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })
      const resData = await response.json()
      if (resData.success) {
        setNotifications(prev =>
          prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Connect to SSE stream
  useEffect(() => {
    const token = storage.getToken()
    if (!token) return

    // Fetch initial list first
    fetchNotifications()

    // Establish SSE
    const baseUrl = getBaseUrl()
    const sseUrl = `${baseUrl}/sse/notifications?token=${encodeURIComponent(token)}`
    
    const eventSource = new EventSource(sseUrl)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnected(true)
      console.log('📡 Real-time notification channel connected')
    }

    eventSource.onerror = (err) => {
      setConnected(false)
      console.warn('⚠️ Real-time notification channel connection lost, attempting reconnect...', err)
    }

    // Custom events
    eventSource.addEventListener('notification', (e) => {
      try {
        const newNotification = JSON.parse(e.data)
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Show hot toast in real-time
        toast(newNotification.message, {
          icon: newNotification.type === 'admin_message' ? '👑' : (newNotification.type === 'churn_alert' ? '⚠️' : '🚨'),
          style: {
            borderRadius: '16px',
            background: '#0f172a',
            color: '#fff',
            border: newNotification.type === 'admin_message' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(59, 130, 246, 0.2)'
          },
          duration: 5000
        })
      } catch (err) {
        console.error('Failed to parse SSE notification payload:', err)
      }
    })

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      setConnected(false)
    }
  }, [fetchNotifications])

  return { notifications, unreadCount, connected, markAsRead, refetch: fetchNotifications }
}
