import { useState, useEffect } from 'react'
import { usersApi } from '../api/usersApi'
import { dashboardApi } from '../api/dashboardApi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import TeamOversightPanel from '../components/admin/TeamOversightPanel'
import ConfirmModal from '../components/hci/ConfirmModal'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [messageModal, setMessageModal] = useState({ isOpen: false, user: null, text: '', sending: false })
  const [adminOverview, setAdminOverview] = useState(null)
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(true)

  useEffect(() => {
    usersApi
      .getAllUsers()
      .then((res) => {
        if (res.data.success) setUsers(res.data.data)
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    dashboardApi
      .getAdminOverview()
      .then((res) => {
        if (res.data.success) setAdminOverview(res.data.data)
      })
      .catch(() => {})
      .finally(() => setAdminOverviewLoading(false))
  }, [])

  const openDeleteConfirm = (userId, userName) => {
    if (userId === currentUser?._id) {
      toast.error("You can't delete your own account")
      return
    }
    setDeleteTarget({ id: userId, name: userName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try {
      await usersApi.deleteUser(deleteTarget.id)
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget.id))
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageModal.text.trim()) return
    setMessageModal((prev) => ({ ...prev, sending: true }))
    try {
      const res = await usersApi.sendAdminMessage(messageModal.user._id, messageModal.text)
      if (res.data.success) {
        toast.success(`Message sent to ${messageModal.user.name}`)
        setMessageModal({ isOpen: false, user: null, text: '', sending: false })
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setMessageModal((prev) => ({ ...prev, sending: false }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between rounded-3xl bg-linear-to-r from-indigo-50/40 via-brand-50/20 to-slate-50/45 dark:from-slate-900/50 dark:to-slate-850/20 border border-slate-100 dark:border-slate-800 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Team Oversight</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time manager performance audit, client distribution, and active timeline communications.
          </p>
        </div>
        <span className="px-3.5 py-1 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-brand-100/50 dark:border-brand-900/30 shrink-0">
          Administrator Control Panel
        </span>
      </div>

      <TeamOversightPanel data={adminOverview} loading={adminOverviewLoading} />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">System User Accounts</h2>
          <p className="text-xs text-slate-500 font-semibold">
            Authorized credentials directory ({users.length} registered user{users.length !== 1 ? 's' : ''}).
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="👤" title="No users found" message="No registered users yet." />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-lg bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left" role="table" aria-label="User directory">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                    {['Name / User Info', 'Email Address', 'Role Permission', 'Theme Style', 'Actions'].map((col) => (
                      <th key={col} className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4" scope="col">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/65">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center border border-brand-100/50">
                            <span className="text-brand-600 dark:text-brand-400 font-extrabold text-sm uppercase">
                              {u.name?.charAt(0)}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {u.name}
                            {u._id === currentUser?._id && (
                              <span className="px-2 py-0.5 text-[9px] font-extrabold bg-brand-50 text-brand-600 dark:bg-brand-950/40 rounded uppercase">
                                You
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-sm font-semibold text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="px-6 py-4.5">
                        <span
                          className={clsx(
                            'text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border',
                            u.role === 'admin'
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400'
                              : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400'
                          )}
                        >
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-xs font-bold text-slate-500 capitalize">
                        {u.preferences?.theme || 'light'} Mode
                      </td>
                      <td className="px-6 py-4.5 flex gap-3 items-center">
                        {u._id !== currentUser?._id && u.role === 'sales_manager' && (
                          <button
                            type="button"
                            onClick={() => setMessageModal({ isOpen: true, user: u, text: '', sending: false })}
                            className="text-xs text-indigo-600 hover:underline font-bold"
                          >
                            Message
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(u._id, u.name)}
                          disabled={deleting === u._id || u._id === currentUser?._id}
                          className="text-xs text-red-600 hover:underline font-bold disabled:opacity-40"
                        >
                          {deleting === u._id ? <LoadingSpinner size="sm" /> : 'Revoke Access'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {messageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold">Message {messageModal.user?.name}</h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={messageModal.text}
                onChange={(e) => setMessageModal((p) => ({ ...p, text: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm min-h-[100px] dark:bg-slate-950"
                placeholder="Type your message..."
                required
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setMessageModal({ isOpen: false, user: null, text: '', sending: false })} className="px-4 py-2 text-sm font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={messageModal.sending} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl disabled:opacity-50">
                  {messageModal.sending ? <LoadingSpinner size="sm" /> : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Revoke access?"
        message={deleteTarget ? `Delete user "${deleteTarget.name}"? This cannot be undone.` : ''}
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  )
}
