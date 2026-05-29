import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, getMonthlyRevenue } from '../lib/finance'
import type { Client } from '../types/client'
import { GlowCard } from './GlowCard'

interface EarningsChartProps {
  clients: Client[]
}

export function EarningsChart({ clients }: EarningsChartProps) {
  const data = clients.map((c) => ({
    name: c.fullName.length > 18 ? `${c.fullName.slice(0, 18)}…` : c.fullName,
    monthly: Number(getMonthlyRevenue(c).toFixed(2)),
  }))

  if (clients.length === 0) {
    return (
      <GlowCard>
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold" style={{ color: `rgb(var(--color-primary-dark))` }}>Monthly revenue</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add clients to see each client&apos;s share of monthly income.
          </p>
        </div>
      </GlowCard>
    )
  }

  return (
    <GlowCard>
      <div className="p-4 md:p-5">
        <h2 className="text-lg font-semibold text-slate-900">Monthly Revenue per Client</h2>
        <br></br>
        <div className="mt-4 h-80 w-full min-h-[16rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={72} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value) => [formatCurrency(typeof value === 'number' ? value : Number(value)), 'Est. monthly']}
                labelStyle={{ color: '#0f172a' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="monthly" name="Est. monthly (CAD)" fill="rgb(var(--color-primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlowCard>
  )
}
