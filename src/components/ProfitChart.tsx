import { useState } from 'react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../lib/finance'
import { aggregateJobsByTimeUnit, filterJobsByDateRange, calculateOverallProfitPercentage } from '../lib/profitChart'
import type { CompletedJob, TimeRange } from '../types/completedJob'
import { GlowCard } from './GlowCard'

interface ProfitChartProps {
  completedJobs: CompletedJob[]
}

const TIME_RANGES: TimeRange[] = ['1D', '1W', '2W', '1M', '1Y']

export function ProfitChart({ completedJobs }: ProfitChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1W')

  const filteredJobs = filterJobsByDateRange(completedJobs, timeRange)
  const data = aggregateJobsByTimeUnit(filteredJobs, timeRange)
  const overallProfitPercentage = calculateOverallProfitPercentage(completedJobs)

  if (completedJobs.length === 0) {
    return (
      <GlowCard>
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
            Profit Chart
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Log completed jobs to see your profit trends over time.
          </p>
        </div>
      </GlowCard>
    )
  }

  if (data.length === 0) {
    return (
      <GlowCard>
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
            Profit Chart
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            No completed jobs in this time range.
          </p>
        </div>
      </GlowCard>
    )
  }

  return (
    <GlowCard>
      <div className="p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Profit Chart</h2>
          <div className="inline-flex rounded-xl border border-slate-300 p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  timeRange === range ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
                style={timeRange === range ? { backgroundColor: 'var(--color-primary)' } : {}}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-80 w-full min-h-[16rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'earnings') {
                    return [formatCurrency(typeof value === 'number' ? value : Number(value)), 'Revenue']
                  }
                  if (name === 'profitPercentage') {
                    return [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Profit %']
                  }
                  return [value, name]
                }}
                labelStyle={{ color: '#0f172a' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                name="earnings"
                stroke="rgb(var(--color-primary))"
                strokeWidth={2}
                dot={{ fill: 'rgb(var(--color-primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlowCard>
  )
}
