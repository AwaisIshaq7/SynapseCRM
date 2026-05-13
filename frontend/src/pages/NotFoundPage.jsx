import { Link } from 'react-router-dom'
import LogoIcon from '../components/LogoIcon'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="mb-8">
        <LogoIcon size={80} />
      </div>
      <div className="text-center">
        <p className="text-8xl font-bold text-brand-600 dark:text-brand-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}