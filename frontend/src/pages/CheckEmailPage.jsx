import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

export default function CheckEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [sending, setSending] = useState(false)

  const resend = async () => {
    if (!email) {
      toast.error('No email on file. Register again.')
      return
    }
    setSending(true)
    try {
      const res = await authApi.resendVerification(email)
      if (res.data.success) toast.success('Verification email sent')
      else toast.error(res.data.error || 'Could not resend')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resend')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card max-w-md w-full p-8 text-center">
        <p className="text-4xl mb-4">📧</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-sm text-gray-600 mb-4">
          We sent a verification link to{' '}
          <strong className="text-gray-900">{email || 'your email'}</strong>.
          You must verify before signing in. Random addresses cannot activate an account without access to that inbox.
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={sending || !email}
          className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
        >
          {sending ? <LoadingSpinner size="sm" /> : 'Resend verification email'}
        </button>
        <Link to="/login" className="text-sm text-indigo-600 hover:underline font-medium">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

