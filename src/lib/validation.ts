import { z } from 'zod'

const phoneOptional = z
  .string()
  .trim()
  .refine((s) => s === '' || /^[0-9+\-()\s]{7,20}$/.test(s), 'Enter a valid phone number or leave blank')

const emailOptional = z
  .string()
  .trim()
  .refine((s) => s === '' || z.string().email().safeParse(s).success, 'Enter a valid email or leave blank')

export const clientSchema = z.object({
  fullName: z.string().trim().min(2, 'Name is required'),
  phone: phoneOptional,
  email: emailOptional,
  address: z.string().trim().min(6, 'Address is required'),
  perCutRate: z.coerce.number().positive('Per-cut rate must be greater than 0'),
  lawnSizeCategory: z.enum(['small', 'medium', 'large']),
  cutDurationMinutes: z.coerce.number().int().positive('Duration must be greater than 0'),
  serviceFrequency: z.enum(['weekly', 'biweekly', 'three_weeks', 'monthly']),
  notes: z.string().trim().max(300, 'Notes cannot exceed 300 characters').optional(),
})

export type ClientSchema = z.infer<typeof clientSchema>
