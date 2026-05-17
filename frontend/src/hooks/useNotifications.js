import { useState, useEffect, useCallback } from 'react'
import { storage } from '../utils/storage'

const POLL_MS = 20000

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [connected, setConnected] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${storage.getToken()}` },
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data || [])
        setUnreadCount((data.data || []).filter((n) => !n.read).length)
        setConnected(true)
        return
      }
      setConnected(false)
    } catch {
      setConnected(false)
    }
  }, [])

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storage.getToken()}`,
          },
          body: JSON.stringify({ notificationIds: [notificationId] }),
        })
        await refresh()
      } catch {
        // silent
      }
    },
    [refresh]
  )

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  return { notifications, unreadCount, connected, refresh, markAsRead }
}
