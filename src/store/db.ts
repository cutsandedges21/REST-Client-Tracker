import Dexie, { type EntityTable } from 'dexie'
import type { Client, ScheduledSlot } from '../types/client'

class ClientDatabase extends Dexie {
  clients!: EntityTable<Client, 'id'>
  appointments!: EntityTable<ScheduledSlot, 'id'>

  constructor() {
    super('client-tracker-db')
    this.version(1).stores({
      clients: '&id, fullName, updatedAt',
    })
    this.version(2)
      .stores({
        clients: '&id, fullName, updatedAt',
        appointments: '&id, clientId, date',
      })
      .upgrade(async (tx) => {
        await tx
          .table('clients')
          .toCollection()
          .modify((c: Record<string, unknown>) => {
            if (c.lawnSizeCategory == null) {
              c.lawnSizeCategory = 'medium'
            }
            if (c.serviceFrequency == null) {
              c.serviceFrequency = 'weekly'
            }
            delete c.lawnSize
            delete c.lawnSizeUnit
          })
      })
    this.version(3)
      .stores({
        clients: '&id, fullName, updatedAt',
        appointments: '&id, clientId, date',
      })
      .upgrade(async (tx) => {
        await tx
          .table('clients')
          .toCollection()
          .modify((c: Record<string, unknown>) => {
            if (c.perCutRate == null) {
              const hr = Number(c.hourlyRate ?? 0)
              const dur = Number(c.cutDurationMinutes ?? 0)
              c.perCutRate = Number((hr * (dur / 60)).toFixed(2)) || hr || 0
            }
            delete c.hourlyRate
          })
      })
    this.version(4)
      .stores({
        clients: '&id, username, fullName, updatedAt',
        appointments: '&id, username, clientId, date',
      })
      .upgrade(async (tx) => {
        // Get the current logged-in user from localStorage
        const auth = localStorage.getItem('userAuth')
        const username = auth ? JSON.parse(auth).username : 'mb08'

        // Add username to existing clients
        await tx
          .table('clients')
          .toCollection()
          .modify((c: Record<string, unknown>) => {
            if (c.username == null) {
              c.username = username
            }
          })

        // Add username to existing appointments
        await tx
          .table('appointments')
          .toCollection()
          .modify((a: Record<string, unknown>) => {
            if (a.username == null) {
              a.username = username
            }
          })
      })
    this.version(5)
      .stores({
        clients: '&id, username, fullName, updatedAt',
        appointments: '&id, username, clientId, date',
      })
      .upgrade(async (tx) => {
        // Add expensePerClient to existing clients
        await tx
          .table('clients')
          .toCollection()
          .modify((c: Record<string, unknown>) => {
            if (c.expensePerClient == null) {
              c.expensePerClient = 0
            }
            // Remove lawnSizeCategory if it exists
            if (c.lawnSizeCategory != null) {
              delete c.lawnSizeCategory
            }
          })
      })
    this.version(6).stores({
      clients: '&id, username, fullName, updatedAt',
      appointments: '&id, username, clientId, date',
      completedJobs: '&id, username, date, clientId',
    })
  }
}

export const db = new ClientDatabase()
