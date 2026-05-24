export type PlanTier = 'free' | 'pro' | 'enterprise'

export type ServiceFrequencyDb = 'weekly' | 'biweekly' | 'three_weeks' | 'monthly'

export interface ProfileRow {
  id: string
  username: string
  account_name: string | null
  plan: PlanTier
  created_at: string
}

export interface ClientRow {
  id: string
  user_id: string
  full_name: string
  phone: string
  email: string
  address: string
  per_cut_rate: number
  expense_per_client: number
  cut_duration_minutes: number
  service_frequency: ServiceFrequencyDb
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentRow {
  id: string
  user_id: string
  client_id: string
  date: string
  time: string
  created_at: string
}

export interface CompletedJobRow {
  id: string
  user_id: string
  client_id: string | null
  client_name: string
  date: string
  earnings: number
  time_spent: number
  expenses: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<ProfileRow, 'id'>>
        Relationships: []
      }
      clients: {
        Row: ClientRow
        Insert: Omit<ClientRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ClientRow, 'id' | 'user_id'>>
        Relationships: []
      }
      appointments: {
        Row: AppointmentRow
        Insert: Omit<AppointmentRow, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<AppointmentRow, 'id' | 'user_id'>>
        Relationships: []
      }
      completed_jobs: {
        Row: CompletedJobRow
        Insert: Omit<CompletedJobRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<CompletedJobRow, 'id' | 'user_id'>>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
