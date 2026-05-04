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
  }
}

export const db = new ClientDatabase()
