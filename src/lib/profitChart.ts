import type { CompletedJob, TimeRange } from '../types/completedJob'

export function getDateRange(timeRange: TimeRange): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (timeRange) {
    case '1D':
      start.setHours(0, 0, 0, 0)
      break
    case '1W':
      start.setDate(end.getDate() - 7)
      break
    case '2W':
      start.setDate(end.getDate() - 14)
      break
    case '1M':
      start.setDate(end.getDate() - 30)
      break
    case '1Y':
      start.setFullYear(end.getFullYear() - 1)
      break
  }

  return { start, end }
}

export function filterJobsByDateRange(jobs: CompletedJob[], timeRange: TimeRange): CompletedJob[] {
  const { start, end } = getDateRange(timeRange)
  return jobs.filter((job) => {
    const jobDate = new Date(job.date)
    return jobDate >= start && jobDate <= end
  })
}

export function aggregateJobsByTimeUnit(jobs: CompletedJob[], timeRange: TimeRange) {
  const aggregation: Record<string, { earnings: number; expenses: number }> = {}

  jobs.forEach((job) => {
    const date = new Date(job.date)
    let key: string

    switch (timeRange) {
      case '1D':
        // Hourly aggregation
        const hour = date.getHours()
        key = `${hour}:00`
        break
      case '1W':
        // Day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        key = days[date.getDay()]
        break
      case '2W':
      case '1M':
        // Daily
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        break
      case '1Y':
        // Monthly
        key = date.toLocaleDateString('en-US', { month: 'short' })
        break
      default:
        key = date.toLocaleDateString()
    }

    if (!aggregation[key]) {
      aggregation[key] = { earnings: 0, expenses: 0 }
    }
    aggregation[key].earnings += job.earnings
    aggregation[key].expenses += job.expenses
  })

  return Object.entries(aggregation).map(([name, data]) => ({
    name,
    earnings: data.earnings,
    expenses: data.expenses,
    profitPercentage: data.earnings > 0
      ? ((data.earnings - data.expenses) / data.earnings) * 100
      : 0,
  }))
}

export function calculateOverallProfitPercentage(jobs: CompletedJob[]): number {
  const totalEarnings = jobs.reduce((sum, job) => sum + job.earnings, 0)
  const totalExpenses = jobs.reduce((sum, job) => sum + job.expenses, 0)

  if (totalEarnings === 0) return 0
  return ((totalEarnings - totalExpenses) / totalEarnings) * 100
}
