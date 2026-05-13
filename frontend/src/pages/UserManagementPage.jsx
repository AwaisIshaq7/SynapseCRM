import { useState, useEffect } from 'react'
import { usersApi } from '../api/usersApi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await usersApi.getAllUsers()
        if (res.data.success) setUsers(res.data.data)
      } catch {
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleDelete = async (userId, userName) => {
    if (userId === currentUser?._id) {
      toast.error("You can't delete your own account")
      return
    }
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setDeleting(userId)
    try {
      await usersApi.deleteUser(userId)
      setUsers(prev => prev.filter(u => u._id !== userId))
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 rounded-2xl bg-linear-to-r from-green-50/50 to-emerald-50/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users.length} user{users.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 text-xs font-medium rounded-full">
          Admin Only
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon="👤" title="No users found" message="No registered users yet." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="User management table">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  {['Name', 'Email', 'Role', 'Theme', 'Actions'].map(col => (
                    <th
                      key={col}
                      className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-3"
                      scope="col"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map(u => (
                  <tr
                    key={u._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    aria-label={`User: ${u.name}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                          <span className="text-brand-700 dark:text-brand-300 font-semibold text-sm">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                          {u._id === currentUser?._id && (
                            <span className="text-xs text-brand-600 dark:text-brand-400">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                        u.role === 'admin'
                          ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      )}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {u.preferences?.theme || 'light'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        disabled={deleting === u._id || u._id === currentUser?._id}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={`Delete user ${u.name}`}
                      >
                        {deleting === u._id ? <LoadingSpinner size="sm" /> : 'Delete'}
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
  )
}