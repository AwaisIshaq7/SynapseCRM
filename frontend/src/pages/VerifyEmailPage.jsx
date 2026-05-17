import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { authApi } from '../api/authApi'
import LoadingSpinner from '../components/LoadingSpinner'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }

    let ignore = false

    authApi
      .verifyEmail(token)
      .then((res) => {
        if (ignore) return
        if (res.data.success) {
          setStatus('success')
          setMessage(res.data.data?.message || 'Email verified successfully.')
        } else {
          setStatus('error')
          setMessage(res.data.error || 'Verification failed.')
        }
      })
      .catch((err) => {
        if (ignore) return
        setStatus('error')
        setMessage(err.response?.data?.error || 'Verification failed.')
      })

    return () => {
      ignore = true
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card max-w-md w-full text-center p-8">
        {status === 'loading' && (
          <>
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-4xl mb-4">✅</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified</h1>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <Link to="/login" className="btn-primary inline-block">Sign in</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <Link to="/login" className="btn-secondary inline-block">Back to login</Link>
          </>
        )}
      </div>
    </div>
  )
}
