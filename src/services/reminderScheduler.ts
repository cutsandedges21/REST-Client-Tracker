import type { ScheduledSlot, Client } from '../types/client'

export type ReminderHandler = (client: Client, appointment: ScheduledSlot) => void

/**
 * Fires ~30 minutes before each appointment. Notifications are delivered via an
 * in-app handler (toast) and, when the user has granted permission, a native
 * browser notification. No email / external service is involved.
 */
export class ReminderScheduler {
  private static instance: ReminderScheduler
  private intervalId: number | null = null
  private appointments: ScheduledSlot[] = []
  private clients: Client[] = []
  private sentReminders: Set<string> = new Set()
  private onReminder: ReminderHandler | null = null

  private constructor() {}

  static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler()
    }
    return ReminderScheduler.instance
  }

  /** Ask for browser-notification permission (no-op if unsupported / already decided). */
  static async requestPermission(): Promise<void> {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // ignore — toasts still work
      }
    }
  }

  start(appointments: ScheduledSlot[], clients: Client[], onReminder?: ReminderHandler) {
    this.appointments = appointments
    this.clients = clients
    if (onReminder) this.onReminder = onReminder

    if (this.intervalId) this.stop()
    this.intervalId = window.setInterval(() => this.checkReminders(), 60000) // every minute
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  updateData(appointments: ScheduledSlot[], clients: Client[]) {
    this.appointments = appointments
    this.clients = clients
  }

  private checkReminders() {
    const now = new Date()

    for (const appointment of this.appointments) {
      const reminderKey = `${appointment.id}-reminder`
      if (this.sentReminders.has(reminderKey)) continue

      const appointmentTime = this.parseAppointmentTime(appointment.date, appointment.time)
      const timeDiff = appointmentTime.getTime() - now.getTime()

      // ~30 minutes out (give or take a minute)
      if (timeDiff > 29 * 60 * 1000 && timeDiff <= 31 * 60 * 1000) {
        const client = this.clients.find((c) => c.id === appointment.clientId)
        if (client) {
          this.fire(client, appointment)
          this.sentReminders.add(reminderKey)
        }
      }
    }
  }

  private fire(client: Client, appointment: ScheduledSlot) {
    this.onReminder?.(client, appointment)

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Upcoming appointment', {
          body: `${client.fullName} at ${appointment.time}${client.address ? ` · ${client.address}` : ''}`,
        })
      } catch {
        // ignore
      }
    }
  }

  private parseAppointmentTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    const [hours, minutes] = time.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes)
  }
}

export const reminderScheduler = ReminderScheduler.getInstance()
