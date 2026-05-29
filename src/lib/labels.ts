import type { ServiceFrequency } from '../types/client'

export const serviceFrequencyLabels: Record<ServiceFrequency, string> = {
  one_time: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  six_weeks: 'Every 6 weeks',
  two_months: 'Every 2 months',
}

/** Short label for tight UI (chips, tables). */
export const serviceFrequencyShort: Record<ServiceFrequency, string> = {
  one_time: 'Once',
  weekly: 'Wk',
  biweekly: 'Bi-wk',
  monthly: 'Mo',
  six_weeks: '6 wk',
  two_months: '2 mo',
}
