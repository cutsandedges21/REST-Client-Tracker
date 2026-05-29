import { z } from 'zod'

const phoneOptional = z
  .string()
  .trim()
  .refine((s) => s === '' || /^[0-9+\-()\s]{7,20}$/.test(s), 'Enter a valid phone number or leave blank')

const emailOptional = z
  .string()
  .trim()
  .refine((s) => s === '' || z.string().email().safeParse(s).success, 'Enter a valid email or leave blank')

export const SERVICE_FREQUENCIES = [
  'one_time',
  'weekly',
  'biweekly',
  'monthly',
  'six_weeks',
  'two_months',
] as const

export const clientSchema = z.object({
  fullName: z.string().trim().min(2, 'Name is required'),
  phone: phoneOptional,
  email: emailOptional,
  address: z.string().trim().min(6, 'Address is required'),
  perCutRate: z.coerce.number().positive('Rate must be greater than 0'),
  expensePerClient: z.coerce.number().min(0, 'Expense cannot be negative'),
  expenseType: z.enum(['fixed', 'percent']).default('fixed'),
  cutDurationMinutes: z.coerce.number().int().positive('Duration must be greater than 0'),
  serviceFrequency: z.enum(SERVICE_FREQUENCIES),
  notes: z.string().trim().max(300, 'Notes cannot exceed 300 characters').optional(),
})

export type ClientSchema = z.infer<typeof clientSchema>

export const expenseSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(120, 'Keep it under 120 characters'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.string().optional(),
})

export type ExpenseSchema = z.infer<typeof expenseSchema>
