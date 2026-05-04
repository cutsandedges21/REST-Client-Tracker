import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Client, ScheduledSlot } from '../types/client'
import { getAvailableTimeOptions, getBookedTimesForDate } from '../store/clientStore'
import { GlowCard } from './GlowCard'

interface ScheduleCalendarProps {
  clients: Client[]
  appointments: ScheduledSlot[]
  onAdd: (input: { clientId: string; date: string; time: string }) => Promise<{ ok: true } | { ok: false; reason: string }>
  onUpdate: (
    id: string,
    input: { clientId: string; date: string; time: string },
  ) => Promise<{ ok: true } | { ok: false; reason: string }>
  onRemove: (id: string) => void
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function sortTimes(times: string[]) {
  return [...times].sort((a, b) => a.localeCompare(b))
}

function availableTimesForEdit(
  appointments: ScheduledSlot[],
  date: string,
  slotId: string,
  originalSlot: ScheduledSlot,
) {
  const booked = getBookedTimesForDate(appointments, date, slotId)
  const base = getAvailableTimeOptions(booked)
  if (date === originalSlot.date && !base.includes(originalSlot.time)) {
    return sortTimes([...base, originalSlot.time])
  }
  return base.length ? base : [originalSlot.time]
}

export function ScheduleCalendar({ clients, appointments, onAdd, onUpdate, onRemove }: ScheduleCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [clientId, setClientId] = useState('')
  /** User’s time choice for “add”; cleared when day changes or after a successful add */
  const [addTimePick, setAddTimePick] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    id: string
    clientId: string
    date: string
    time: string
  } | null>(null)

  const year = cursor.getFullYear()
  const monthIndex = cursor.getMonth()
  const monthLabel = cursor.toLocaleString('en-CA', { month: 'long', year: 'numeric' })

  const cells = useMemo(() => {
    const first = new Date(year, monthIndex, 1)
    const last = new Date(year, monthIndex + 1, 0)
    const daysInMonth = last.getDate()
    const startPad = first.getDay()
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7
    const out: { key: string | null }[] = []
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - startPad + 1
      if (dayNum < 1 || dayNum > daysInMonth) {
        out.push({ key: null })
      } else {
        out.push({ key: toDateKey(year, monthIndex, dayNum) })
      }
    }
    return out
  }, [year, monthIndex])

  const slotsByDate = useMemo(() => {
    const map = new Map<string, ScheduledSlot[]>()
    for (const a of appointments) {
      const list = map.get(a.date) ?? []
      list.push(a)
      map.set(a.date, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.time.localeCompare(b.time))
    }
    return map
  }, [appointments])

  const selectedSlots = selectedDate ? slotsByDate.get(selectedDate) ?? [] : []

  const bookedForSelected = selectedDate ? getBookedTimesForDate(appointments, selectedDate) : new Set<string>()
  const availableForAdd = getAvailableTimeOptions(bookedForSelected)
  const resolvedAddTime =
    availableForAdd.length === 0
      ? ''
      : addTimePick && availableForAdd.includes(addTimePick)
        ? addTimePick
        : availableForAdd[0]

  const originalSlot = editDraft ? appointments.find((a) => a.id === editDraft.id) : undefined
  const availableForEdit =
    editDraft && originalSlot ? availableTimesForEdit(appointments, editDraft.date, editDraft.id, originalSlot) : []
  const resolvedEditTime =
    editDraft && availableForEdit.length
      ? availableForEdit.includes(editDraft.time)
        ? editDraft.time
        : availableForEdit[0]
      : editDraft?.time ?? ''

  const goPrev = () => setCursor(new Date(year, monthIndex - 1, 1))
  const goNext = () => setCursor(new Date(year, monthIndex + 1, 1))

  const selectDay = (key: string) => {
    setSelectedDate(key)
    setEditDraft(null)
    setAddTimePick(null)
  }

  const handleAdd = async () => {
    if (!selectedDate || !clientId || !resolvedAddTime) return
    if (bookedForSelected.has(resolvedAddTime)) {
      toast.error('That time is already booked on this day.')
      return
    }
    const result = await onAdd({ clientId, date: selectedDate, time: resolvedAddTime })
    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    toast.success('Appointment Scheduled Successfully')
    setAddTimePick(null)
  }

  const handleSaveEdit = async () => {
    if (!editDraft || !originalSlot) return
    const time = resolvedEditTime
    const result = await onUpdate(editDraft.id, {
      clientId: editDraft.clientId,
      date: editDraft.date,
      time,
    })
    if (!result.ok) {
      toast.error(result.reason)
      return
    }
    toast.success('Appointment Updated Successfully')
    setEditDraft(null)
  }

  const startEdit = (s: ScheduledSlot) => {
    setEditDraft({ id: s.id, clientId: s.clientId, date: s.date, time: s.time })
  }

  const clientName = (id: string) => clients.find((c) => c.id === id)?.fullName ?? 'Unknown'

  return (
    <GlowCard>
      <div className="p-4 md:p-5">
        <h2 className="text-lg font-semibold text-slate-900">Schedule</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each day/time can only be booked once. Tap a day, pick a free slot, then add. Edit or remove mistakes below.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <p className="text-base font-semibold text-slate-900">{monthLabel}</p>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {weekdayLabels.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell.key) {
              return <div key={`empty-${idx}`} className="min-h-[4.5rem] rounded-lg bg-slate-50/50" />
            }
            const dayKey = cell.key
            const slots = slotsByDate.get(dayKey) ?? []
            const isSelected = selectedDate === dayKey
            const isToday =
              dayKey === toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => selectDay(dayKey)}
                className={`flex min-h-[4.5rem] flex-col rounded-lg border p-1.5 text-left transition ${isSelected
                  ? 'border-[var(--color-primary)] ring-2'
                  : 'border-slate-200 bg-white'
                  } ${isToday && !isSelected ? 'ring-1 ring-[var(--color-primary)]' : ''}`}
                style={isSelected ? {
                  backgroundColor: `rgba(var(--color-primary-light), 0.5)`
                } : {}}
              >
                <span className="text-xs font-semibold text-slate-800">{parseDateKey(dayKey).getDate()}</span>
                <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-hidden">
                  {slots.slice(0, 2).map((s) => (
                    <span
                      key={s.id}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `rgba(var(--color-primary-light), 0.7)`,
                        color: `rgb(var(--color-primary-dark))`
                      }}
                    >
                      {s.time} {clientName(s.clientId).split(' ')[0]}
                    </span>
                  ))}
                  {slots.length > 2 ? <span className="text-[10px] text-slate-500">+{slots.length - 2} more</span> : null}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          {editDraft && originalSlot ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800">Edit appointment</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Client</span>
                  <select
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    value={editDraft.clientId}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, clientId: e.target.value } : d))}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Date</span>
                  <input
                    type="date"
                    value={editDraft.date}
                    onChange={(e) => {
                      const d = e.target.value
                      setEditDraft((prev) => {
                        if (!prev) return prev
                        const orig = appointments.find((a) => a.id === prev.id)
                        if (!orig) return prev
                        const opts = availableTimesForEdit(appointments, d, prev.id, orig)
                        const nextTime = opts.includes(prev.time) ? prev.time : opts[0] ?? prev.time
                        return { ...prev, date: d, time: nextTime }
                      })
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="font-medium text-slate-700">Time (only free slots)</span>
                  <select
                    value={resolvedEditTime}
                    onChange={(e) => setEditDraft((d) => (d ? { ...d, time: e.target.value } : d))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                  >
                    {availableForEdit.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditDraft(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
                  style={{ backgroundColor: `var(--color-primary)` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary-dark)`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary)`}
                >
                  Save changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-800">
                {selectedDate
                  ? `Add visit on ${parseDateKey(selectedDate).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}`
                  : 'Select a day on the calendar'}
              </p>
              {selectedDate ? (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Client</span>
                    <select
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                    >
                      <option value="">Choose…</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex w-full flex-col gap-1 text-sm sm:min-w-[8rem] sm:max-w-xs">
                    <span className="font-medium text-slate-700">Time</span>
                    {availableForAdd.length === 0 ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        All slots are booked for this day.
                      </p>
                    ) : (
                      <select
                        value={resolvedAddTime}
                        onChange={(e) => setAddTimePick(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                      >
                        {availableForAdd.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                  <button
                    type="button"
                    disabled={!clientId || availableForAdd.length === 0}
                    onClick={() => void handleAdd()}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: `var(--color-primary)` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary-dark)`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `var(--color-primary)`}
                  >
                    Add to schedule
                  </button>
                </div>
              ) : null}
            </>
          )}

          {selectedDate && selectedSlots.length > 0 && !editDraft ? (
            <ul className="mt-4 space-y-2">
              {selectedSlots.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="text-slate-800">
                    <span className="font-semibold">{s.time}</span>
                    <span className="text-slate-600"> — {clientName(s.clientId)}</span>
                  </span>
                  <span className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="rounded-lg p-2 text-slate-500 transition"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `rgba(var(--color-primary-light), 0.5)`
                        e.currentTarget.style.color = `rgb(var(--color-primary-dark))`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = ''
                      }}
                      aria-label="Edit appointment"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(s.id)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                      aria-label="Remove slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </GlowCard>
  )
}
