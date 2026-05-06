import React from 'react'
import { GlowCard } from './GlowCard'

export function AllTimeStats({ totalEarnings, totalTime, totalExpenses }) {
  const netEarnings = totalEarnings - totalExpenses
  const profitPercentage = totalEarnings > 0
    ? ((totalEarnings - totalExpenses) / totalEarnings) * 100
    : 0

  return (
    <GlowCard>
      <div className="p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: `rgb(var(--color-primary-dark))` }}>All-Time Statistics</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your total earnings, time spent, expenses, and net profit across all time.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-slate-600">Total Earnings</p>
            <p className="text-2xl font-bold" style={{ color: `rgb(var(--color-primary-dark))` }}>${totalEarnings.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-slate-600">Total Time</p>
            <p className="text-2xl font-bold" style={{ color: `rgb(var(--color-primary-dark))` }}>{(totalTime / 60).toFixed(1)}h</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-slate-600">Total Expenses</p>
            <p className="text-2xl font-bold text-rose-600">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-slate-600">Net Earnings</p>
            <p className={`text-2xl font-bold ${netEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netEarnings.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-slate-600">Profit %</p>
            <p className={`text-2xl font-bold ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </GlowCard>
  )
}