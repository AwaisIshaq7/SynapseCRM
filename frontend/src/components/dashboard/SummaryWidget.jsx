import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../StatCard'
import { StatCardSkeleton } from './DashboardSkeletons'

export default function SummaryWidget({ summary, kpiTrends, loading, trackWidget }) {
  const navigate = useNavigate()

  return (
    <section className="scroll-animate" onClick={() => trackWidget('summary')}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Overview
      </h2>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Customers"
            value={summary?.totalCustomers}
            loading={loading}
            trend={kpiTrends.totalCustomers}
            colorClass="text-brand-600 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            onClick={() => navigate('/customers')}
          />
          <StatCard
            label="At Risk"
            value={summary?.atRiskCount}
            loading={loading}
            trend={kpiTrends.atRiskCount}
            trendDown={true}
            colorClass="text-red-600 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            onClick={() => navigate('/customers?status=at_risk')}
          />
          <StatCard
            label="Positive Sentiment"
            value={summary?.positiveCount}
            loading={loading}
            trend={kpiTrends.positiveSentiment}
            colorClass="text-green-600 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Negative Sentiment"
            value={summary?.negativeCount}
            loading={loading}
            trend={kpiTrends.negativeSentiment}
            trendDown={true}
            colorClass="text-amber-600 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
      )}
    </section>
  )
}
