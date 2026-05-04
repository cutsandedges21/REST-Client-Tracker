import { motion } from 'framer-motion'
import { DollarSign, Timer, Users } from 'lucide-react'
import { formatCurrency, formatTotalMonthlyTime } from '../lib/finance'
import { GlowCard } from './GlowCard'

interface DashboardStatsProps {
  totalClients: number
  totalMonthlyRevenue: number
  totalMonthlyMinutes: number
}

const stats = [
  { key: 'totalClients', title: 'Total Clients', icon: Users, format: 'count' as const },
  { key: 'totalMonthlyRevenue', title: 'Est. Monthly Revenue', icon: DollarSign, format: 'currency' as const },
  { key: 'totalMonthlyMinutes', title: 'Total Time / Month', icon: Timer, format: 'duration' as const },
] as const

export function DashboardStats({ totalClients, totalMonthlyRevenue, totalMonthlyMinutes }: DashboardStatsProps) {
  const values = {
    totalClients,
    totalMonthlyRevenue,
    totalMonthlyMinutes,
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const raw = values[stat.key]
        const displayValue =
          stat.format === 'count'
            ? raw
            : stat.format === 'currency'
              ? formatCurrency(Number(Number(raw).toFixed(2)))
              : formatTotalMonthlyTime(raw as number)

        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.28 }}
          >
            <GlowCard>
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <Icon className="h-4 w-4" style={{ color: `rgb(var(--color-primary))` }} />
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{displayValue}</p>

              </div>
            </GlowCard>
          </motion.div>
        )
      })}
    </section>
  )
}
