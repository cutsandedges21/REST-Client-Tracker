import type { LawnSizeCategory, ServiceFrequency } from '../types/client'

export const lawnSizeLabels: Record<LawnSizeCategory, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
}

export const serviceFrequencyLabels: Record<ServiceFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  three_weeks: 'Every 3 weeks',
  monthly: 'Once a month',
}
