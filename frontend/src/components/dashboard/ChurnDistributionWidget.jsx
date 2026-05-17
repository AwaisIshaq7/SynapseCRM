import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import clsx from 'clsx'
import { ChartSkeleton } from './DashboardSkeletons'

export default function ChurnDistributionWidget({ churnDist, loading, churnChartData, doughnutOptions, trackWidget }) {
  return (
    <section className="card scroll-animate" onClick={() => trackWidget('churn')}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Churn Risk Distribution
      </h2>
      {loading ? (
        <ChartSkeleton />
      ) : churnChartData ? (
        <div className="flex items-center gap-6">
          <div className="w-44 h-44 shrink-0">
            <Doughnut data={churnChartData} options={doughnutOptions} />
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'High Risk', value: churnDist?.high || 0, color: 'bg-red-500' },
              { label: 'Medium Risk', value: churnDist?.medium || 0, color: 'bg-amber-500' },
              { label: 'Low Risk', value: churnDist?.low || 0, color: 'bg-green-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={clsx('w-3 h-3 rounded-full shrink-0', item.color)} aria-hidden="true" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data available</div>
      )}
    </section>
  )
}
