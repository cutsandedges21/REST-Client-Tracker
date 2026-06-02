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
  const startDateStr = start.toISOString().split('T')[0]
  const endDateStr = end.toISOString().split('T')[0]
  return jobs.filter((job) => {
    return job.date >= startDateStr && job.date <= endDateStr
  })
}

export function aggregateJobsByTimeUnit(jobs: CompletedJob[], timeRange: TimeRange) {
  // Each bucket stores a sortable key alongside its display label so we can
  // sort chronologically (oldest → newest, left → right) after aggregating.
  const aggregation: Record<string, { label: string; earnings: number; expenses: number }> = {}

  jobs.forEach((job) => {
    // Parse as local date to avoid UTC-offset day-of-week errors.
    const [y, m, d] = job.date.split('-').map(Number)
    const date = new Date(y, m - 1, d)

    let sortKey: string
    let label: string

    switch (timeRange) {
      case '1D': {
        const hour = date.getHours()
        sortKey = String(hour).padStart(2, '0')
        label = `${hour}:00`
        break
      }
      case '1W': {
        // Sort key is the ISO date; label is the short day name.
        sortKey = job.date
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        label = days[date.getDay()]
        break
      }
      case '2W':
      case '1M': {
        // Sort key is ISO date (lexicographic = chronological).
        sortKey = job.date
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        break
      }
      case '1Y': {
        // Sort key is YYYY-MM so it stays correct across a year boundary.
        sortKey = `${y}-${String(m).padStart(2, '0')}`
        label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        break
      }
      default:
        sortKey = job.date
        label = date.toLocaleDateString()
    }

    if (!aggregation[sortKey]) {
      aggregation[sortKey] = { label, earnings: 0, expenses: 0 }
    }
    aggregation[sortKey].earnings += job.earnings
    aggregation[sortKey].expenses += job.expenses
  })

  // Sort ascending so older dates appear on the left of the chart.
  return Object.entries(aggregation)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, bucket]) => ({
      name: bucket.label,
      earnings: bucket.earnings,
      expenses: bucket.expenses,
      profitPercentage:
        bucket.earnings > 0
          ? ((bucket.earnings - bucket.expenses) / bucket.earnings) * 100
          : 0,
    }))
}

export function calculateOverallProfitPercentage(jobs: CompletedJob[]): number {
  const totalEarnings = jobs.reduce((sum, job) => sum + job.earnings, 0)
  const totalExpenses = jobs.reduce((sum, job) => sum + job.expenses, 0)

  if (totalEarnings === 0) return 0
  return ((totalEarnings - totalExpenses) / totalEarnings) * 100
}
