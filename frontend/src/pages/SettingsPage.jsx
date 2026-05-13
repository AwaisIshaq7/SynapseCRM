import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usersApi } from '../api/usersApi'
import ThemeToggle from '../components/ThemeToggle'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const WIDGET_LABELS = {
  summary:   '📊 Overview Stats',
  sentiment: '📈 Sentiment Trend Chart',
  churn:     '🔴 Churn Distribution',
  alerts:    '⚠️ Churn Alerts',
  recent:    '💬 Recent Interactions',
}

export default function SettingsPage() {
  const { user, updateUserPreferences } = useAuth()
  const [saving, setSaving] = useState(false)

  const currentOrder = user?.preferences?.widgetOrder
    || ['summary', 'churn', 'sentiment', 'recent', 'alerts']

  const [widgetOrder, setWidgetOrder] = useState(currentOrder)

  const moveWidget = (idx, direction) => {
    const newOrder = [...widgetOrder]
    const swap     = idx + direction
    if (swap < 0 || swap >= newOrder.length) return
    ;[newOrder[idx], newOrder[swap]] = [newOrder[swap], newOrder[idx]]
    setWidgetOrder(newOrder)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await usersApi.updatePreferences({
        theme: user?.preferences?.theme || 'light',
        widgetOrder,
      })
      updateUserPreferences({ widgetOrder })
      toast.success('Settings saved ✅')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl bg-linear-to-r from-orange-50/50 to-amber-50/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

      {/* Appearance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Currently: <strong>{user?.preferences?.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Widget Order */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dashboard Widget Order</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Drag or use arrows to reorder widgets. The system also auto-adapts after 5 interactions.
        </p>
        <ol className="space-y-2" aria-label="Dashboard widget order">
          {widgetOrder.map((widget, idx) => (
            <li
              key={widget}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50
                         border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {WIDGET_LABELS[widget] || widget}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveWidget(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                             dark:hover:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-30
                             disabled:cursor-not-allowed transition-colors"
                  aria-label={`Move ${WIDGET_LABELS[widget]} up`}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveWidget(idx, 1)}
                  disabled={idx === widgetOrder.length - 1}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200
                             dark:hover:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-30
                             disabled:cursor-not-allowed transition-colors"
                  aria-label={`Move ${WIDGET_LABELS[widget]} down`}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex justify-end mt-4">
          <button onClick={saveSettings} disabled={saving} className="btn-primary">
            {saving ? <><LoadingSpinner size="sm" /> Saving...</> : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Name',  value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Role',  value: user?.role?.replace('_', ' ') },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}