import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usersApi } from '../api/usersApi'
import ThemeToggle from '../components/ThemeToggle'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import axiosInstance from '../api/axiosInstance'
import { Download, Database, ShieldAlert, FileSpreadsheet, FileJson, Check } from 'lucide-react'

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

  const [exportingCsv, setExportingCsv] = useState(false)
  const [csvProgress, setCsvProgress] = useState(0)
  const [exportingJson, setExportingJson] = useState(false)
  const [jsonProgress, setJsonProgress] = useState(0)
  const [lastBackupTime, setLastBackupTime] = useState(
    localStorage.getItem('last_backup_time') || null
  )

  const triggerCsvExport = async () => {
    if (exportingCsv) return
    setExportingCsv(true)
    setCsvProgress(5)
    
    const interval = setInterval(() => {
      setCsvProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 15
      })
    }, 150)

    try {
      const response = await axiosInstance.get('/dashboard/export/portfolio', {
        responseType: 'blob'
      })
      
      clearInterval(interval)
      setCsvProgress(100)

      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `portfolio_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      const stamp = new Date().toLocaleString()
      setLastBackupTime(stamp)
      localStorage.setItem('last_backup_time', stamp)
      toast.success('Portfolio CSV exported successfully! 💾')
    } catch (err) {
      clearInterval(interval)
      toast.error('Failed to export CSV')
    } finally {
      setTimeout(() => {
        setExportingCsv(false)
        setCsvProgress(0)
      }, 800)
    }
  }

  const triggerJsonBackup = async () => {
    if (exportingJson) return
    setExportingJson(true)
    setJsonProgress(5)

    const interval = setInterval(() => {
      setJsonProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await axiosInstance.get('/dashboard/export/system', {
        responseType: 'blob'
      })

      clearInterval(interval)
      setJsonProgress(100)

      const blob = new Blob([response.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `synapse_crm_backup_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      const stamp = new Date().toLocaleString()
      setLastBackupTime(stamp)
      localStorage.setItem('last_backup_time', stamp)
      toast.success('Master System Backup JSON compiled! 🛡️')
    } catch (err) {
      clearInterval(interval)
      toast.error('Failed to compile master system JSON backup')
    } finally {
      setTimeout(() => {
        setExportingJson(false)
        setJsonProgress(0)
      }, 800)
    }
  }

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



      {/* Local Backup & Data Export Center */}
      <div className="card border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
        <div className="flex items-center gap-3.5 mb-4 pb-3 border-b border-slate-50 dark:border-slate-850/65">
          <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400">
            <Database size={20} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Local Backup & Data Export Center</h2>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 font-medium">
              Securely compile and download offline data for analytical audits or system recovery.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Sales Manager Section */}
          <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                  Manager Portfolio Export
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-md leading-normal font-semibold">
                  Compiles your assigned accounts into a clean, RFC-compliant CSV spreadsheet containing full contact info, ML churn risks, and communication history.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-100/55 dark:border-emerald-900/30">
                CSV Format
              </span>
            </div>

            {/* CSV Mock Progress Indicator */}
            {exportingCsv && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-450">
                  <span>Serializing portfolio records...</span>
                  <span>{csvProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${csvProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={triggerCsvExport}
              disabled={exportingCsv || exportingJson}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 text-slate-705 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-750 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
            >
              {exportingCsv ? (
                <>
                  <LoadingSpinner size="sm" />
                  Generating CSV File...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download CSV Portfolio
                </>
              )}
            </button>
          </div>

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="p-4 rounded-2xl border border-brand-100/40 dark:border-brand-900/10 bg-linear-to-r from-brand-50/10 to-indigo-50/5 dark:from-slate-950/20 dark:to-slate-950/10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <FileJson size={16} className="text-indigo-500" />
                    Master System Backup
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-550 mt-1 max-w-md leading-normal font-semibold">
                    Compiles a complete structured database JSON snapshot of the system. Includes all clients, timeline interactions, user records, and notification logs.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-450 border border-indigo-100/55 dark:border-indigo-900/30">
                  JSON Master
                </span>
              </div>

              {/* JSON Mock Progress Indicator */}
              {exportingJson && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-450">
                    <span>Compressing master schemas...</span>
                    <span>{jsonProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${jsonProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={triggerJsonBackup}
                disabled={exportingCsv || exportingJson}
                className="w-full py-2.5 rounded-xl border border-indigo-150/40 hover:border-indigo-300 dark:border-slate-700 bg-white hover:bg-slate-50 text-indigo-650 hover:text-indigo-700 dark:bg-slate-800 dark:text-indigo-350 dark:hover:bg-slate-750 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
              >
                {exportingJson ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Compiling Master Backup...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Compile Master System Backup
                  </>
                )}
              </button>
            </div>
          )}

          {/* Secure Audit Stamps */}
          {lastBackupTime && (
            <div className="pt-2 text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Last Backup Run: {lastBackupTime}
            </div>
          )}
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