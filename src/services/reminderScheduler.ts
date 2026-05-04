import { emailService } from './emailService.js'
import type { ScheduledSlot, Client } from '../types/client'

export class ReminderScheduler {
  private static instance: ReminderScheduler
  private intervalId: number | null = null
  private appointments: ScheduledSlot[] = []
  private clients: Client[] = []
  private sentReminders: Set<string> = new Set()

  private constructor() {}

  static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler()
    }
    return ReminderScheduler.instance
  }

  start(appointments: ScheduledSlot[], clients: Client[]) {
    this.appointments = appointments
    this.clients = clients

    if (this.intervalId) {
      this.stop()
    }

    this.intervalId = window.setInterval(() => {
      this.checkReminders()
    }, 60000) // Check every minute
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
    const userEmail = emailService.getUserEmail()

    if (!userEmail) return

    for (const appointment of this.appointments) {
      const reminderKey = `${appointment.id}-reminder`

      if (this.sentReminders.has(reminderKey)) continue

      const appointmentTime = this.parseAppointmentTime(appointment.date, appointment.time)
      const timeDiff = appointmentTime.getTime() - now.getTime()

      // Check if appointment is in 30 minutes (give or take 1 minute)
      if (timeDiff > 29 * 60 * 1000 && timeDiff <= 31 * 60 * 1000) {
        const client = this.clients.find(c => c.id === appointment.clientId)
        if (client) {
          void emailService.sendEmail({
            type: 'reminder',
            client,
            appointment
          })
          this.sentReminders.add(reminderKey)
        }
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