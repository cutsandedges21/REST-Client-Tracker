import { useMemo, type ReactNode } from 'react'
import { GlowCard } from './GlowCard'
import {
  formatCurrency,
  formatPercent,
  hourlyRate,
  profitMargin,
  profitMarkup,
} from '../lib/finance'
import type { CompletedJob } from '../types/completedJob'
import type { Expense } from '../types/expense'

interface AllTimeStatsProps {
  completedJobs: CompletedJob[]
  expenses: Expense[]
}

export function AllTimeStats({ completedJobs, expenses }: AllTimeStatsProps) {
  const s = useMemo(() => {
    const earnings = completedJobs.reduce((sum, j) => sum + j.earnings, 0)
    const minutes = completedJobs.reduce((sum, j) => sum + j.timeSpent, 0)
    const jobExpenses = completedJobs.reduce((sum, j) => sum + j.expenses, 0)
    const businessExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalExpenses = jobExpenses + businessExpenses
    const net = earnings - totalExpenses
    return {
      earnings,
      minutes,
      totalExpenses,
      net,
      hours: minutes / 60,
      margin: profitMargin(earnings, totalExpenses),
      markup: profitMarkup(earnings, totalExpenses),
      hourly: hourlyRate(earnings, minutes),
    }
  }, [completedJobs, expenses])

  const hasData = completedJobs.length > 0 || expenses.length > 0

  return (
    <GlowCard>
      <div className="p-5 md:p-6">
        <h2 className="font-display text-2xl font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>
          All-time
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {hasData
            ? `Across ${completedJobs.length} completed ${completedJobs.length === 1 ? 'job' : 'jobs'} · ${formatCurrency(s.totalExpenses)} total expenses`
            : 'Complete a job to start tracking your real earnings, margin and hourly rate.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Tile label="Total earnings" emphasis>
            {formatCurrency(s.earnings)}
          </Tile>
          <Tile label="Net profit" tone={s.net >= 0 ? 'positive' : 'negative'}>
            {formatCurrency(s.net)}
          </Tile>
          <Tile label="Hourly rate">{formatCurrency(s.hourly)}<span className="text-base font-normal text-slate-400">/h</span></Tile>
          <Tile label="Profit margin" tone={s.margin >= 0 ? 'positive' : 'negative'}>
            {formatPercent(s.margin)}
          </Tile>
          <Tile label="Markup" tone={s.markup >= 0 ? 'positive' : 'negative'}>
            {formatPercent(s.markup)}
          </Tile>
          <Tile label="Hours worked">{s.hours.toFixed(1)}<span className="text-base font-normal text-slate-400">h</span></Tile>
        </div>
      </div>
    </GlowCard>
  )
}

function Tile({
  label,
  children,
  emphasis,
  tone,
}: {
  label: string
  children: ReactNode
  emphasis?: boolean
  tone?: 'positive' | 'negative'
}) {
  const color = emphasis
    ? 'rgb(var(--color-primary-dark))'
    : tone === 'positive'
      ? '#059669'
      : tone === 'negative'
        ? '#e11d48'
        : undefined
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p
        className={`stat-figure mt-2 text-xl sm:text-2xl ${color ? '' : 'text-slate-900'}`}
        style={color ? { color } : undefined}
      >
        {children}
      </p>
    </div>
  )
}
