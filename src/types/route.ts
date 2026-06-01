/** How a client paid for a visit. Stored on the linked completed job. */
export type PaymentMethod = 'cash' | 'etransfer' | 'card' | 'other'

/**
 * A single planned stop on a day's route. The plan is just an ordered list of
 * clients for a date. A stop is "done" once `completedJobId` is set — that
 * linked completed job carries the earnings, time and payment status.
 */
export interface RouteStop {
  id: string
  username: string
  clientId: string
  /** YYYY-MM-DD — which day's route this stop belongs to. */
  date: string
  /** Position in the route (ascending). */
  sortOrder: number
  /** Set when the stop is logged as done; null while still to-do. */
  completedJobId: string | null
  createdAt: string
  updatedAt: string
}
