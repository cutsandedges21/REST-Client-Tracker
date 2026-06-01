# Nav / Route / Invoice Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Schedule tab with Expenses and a new Add tab, wire scheduling to auto-populate the Route page, and add a live-preview + color-picker invoice email editor.

**Architecture:** All changes are pure front-end except one nullable Supabase column (`invoice_accent_color` on `profiles`). The `ScheduledSlot` / appointments DB tables are left intact — only the UI that creates them is removed. `addRouteStop` gains an optional `time` param whose value becomes `sortOrder` (minutes-since-midnight), ensuring scheduled stops sort chronologically.

**Tech Stack:** React 18, TypeScript, Zustand, Tailwind CSS, Framer Motion, Supabase JS, Lucide React, Sonner toasts.

---

## File Map

| File | Action | Reason |
|---|---|---|
| `src/types/database.ts` | Modify | Add `invoice_accent_color` to `ProfileRow` |
| `src/lib/invoice.ts` | Modify | New `DEFAULT_INVOICE_TEMPLATE` |
| `src/lib/api.ts` | Modify | `updateProfileInvoiceSettings` writes `invoice_accent_color` |
| `src/components/AppNav.tsx` | Modify | 6-tab layout: add `add` + `expenses`, remove `schedule` |
| `src/store/clientStore.ts` | Modify | `addRouteStop` gains optional `time` → sortOrder |
| `src/components/ClientList.tsx` | Modify | Remove `appointments` prop + all next-appointment UI |
| `src/components/ClientForm.tsx` | Modify | Rename label: "appointment" → "visit" |
| `src/AuthedApp.tsx` | Modify | New Add/Expenses tabs, remove schedule + reminders, route onSchedule |
| `src/pages/InvoiceTemplatePage.tsx` | Modify | Color picker + live preview iframe |
| `src/components/InvoiceDialog.tsx` | Modify | Prefer `profile.invoice_accent_color` over theme color |
| Supabase migration | Create | `ALTER TABLE profiles ADD COLUMN invoice_accent_color TEXT` |

---

## Task 1: Supabase migration + database type

**Files:**
- Modify: `src/types/database.ts:13-25`

- [ ] **Step 1.1: Apply the Supabase migration**

Use the Supabase MCP `apply_migration` tool with name `add_invoice_accent_color` and SQL:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_accent_color TEXT;
```

- [ ] **Step 1.2: Add the column to `ProfileRow`**

In `src/types/database.ts`, add `invoice_accent_color` to `ProfileRow`:

```ts
export interface ProfileRow {
  id: string
  username: string
  account_name: string | null
  plan: PlanTier
  /** Saved default invoice email body (with {{placeholders}}). */
  invoice_template: string | null
  /** Business name shown on invoices. */
  business_name: string | null
  /** Custom hex colour for the invoice email header. Falls back to theme when null. */
  invoice_accent_color: string | null
  /** Stripe customer id, set after first checkout. */
  stripe_customer_id: string | null
  created_at: string
}
```

- [ ] **Step 1.3: Commit**

```bash
git add src/types/database.ts
git commit -m "feat(invoice): add invoice_accent_color column to profiles"
```

---

## Task 2: Update default invoice template

**Files:**
- Modify: `src/lib/invoice.ts:1-6`

- [ ] **Step 2.1: Replace `DEFAULT_INVOICE_TEMPLATE`**

In `src/lib/invoice.ts`, replace the `DEFAULT_INVOICE_TEMPLATE` constant (lines 1–6):

```ts
export const DEFAULT_INVOICE_TEMPLATE = `Hi {{client}},

Thanks for your business! Here is your invoice from {{business}}.

Service: {{service}}
Date: {{date}}
Amount due: {{amount}}

Payment can be made by cash, e-transfer, or cheque. Reply to this email with any questions.

Thank you,
{{business}}`
```

- [ ] **Step 2.2: Commit**

```bash
git add src/lib/invoice.ts
git commit -m "feat(invoice): update default invoice message template"
```

---

## Task 3: `api.ts` — write invoice_accent_color

**Files:**
- Modify: `src/lib/api.ts:150-163`

- [ ] **Step 3.1: Update `updateProfileInvoiceSettings` signature and patch logic**

Replace the entire `updateProfileInvoiceSettings` function in `src/lib/api.ts`:

```ts
export async function updateProfileInvoiceSettings(
  userId: string,
  settings: {
    invoiceTemplate?: string | null
    businessName?: string | null
    invoiceAccentColor?: string | null
  },
): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (settings.invoiceTemplate !== undefined) patch.invoice_template = settings.invoiceTemplate
  if (settings.businessName !== undefined) patch.business_name = settings.businessName
  if (settings.invoiceAccentColor !== undefined) patch.invoice_accent_color = settings.invoiceAccentColor
  if (Object.keys(patch).length === 0) return
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) {
    console.error('[api] updateProfileInvoiceSettings failed:', error)
    throw error
  }
}
```

- [ ] **Step 3.2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat(invoice): persist invoice_accent_color via updateProfileInvoiceSettings"
```

---

## Task 4: AppNav — 6 tabs

**Files:**
- Modify: `src/components/AppNav.tsx`

- [ ] **Step 4.1: Rewrite AppNav with new tabs**

Replace the entire contents of `src/components/AppNav.tsx`:

```tsx
import { Home, Menu, Receipt, Route, UserPlus, Users } from 'lucide-react'

export type AppTab = 'home' | 'add' | 'clients' | 'route' | 'expenses' | 'more'

const ITEMS: { tab: AppTab; label: string; Icon: typeof Home }[] = [
  { tab: 'home', label: 'Home', Icon: Home },
  { tab: 'add', label: 'Add', Icon: UserPlus },
  { tab: 'clients', label: 'Clients', Icon: Users },
  { tab: 'route', label: 'Route', Icon: Route },
  { tab: 'expenses', label: 'Expenses', Icon: Receipt },
  { tab: 'more', label: 'More', Icon: Menu },
]

interface AppNavProps {
  active: AppTab
  onChange: (tab: AppTab) => void
  variant: 'top' | 'bottom'
}

export function AppNav({ active, onChange, variant }: AppNavProps) {
  if (variant === 'top') {
    return (
      <nav className="hidden md:flex">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#18181b]/70">
          {ITEMS.map(({ tab, label, Icon }) => {
            const isActive = active === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onChange(tab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
                style={isActive ? { backgroundColor: 'rgb(var(--color-primary))' } : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/85 backdrop-blur-lg dark:border-white/10 dark:bg-[#0f0f12]/95 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-safe">
        {ITEMS.map(({ tab, label, Icon }) => {
          const isActive = active === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition"
              style={{ color: isActive ? 'rgb(var(--color-primary))' : '#94a3b8' }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className="grid h-8 w-10 place-items-center rounded-xl transition"
                style={isActive ? { backgroundColor: 'rgba(var(--color-primary-light), 0.9)' } : undefined}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

Note: bottom-nav icon pill is slightly smaller (`h-8 w-10` vs `h-9 w-12`) and font is `text-[10px]` (vs `text-[11px]`) to accommodate 6 tabs without overflow.

- [ ] **Step 4.2: Commit**

```bash
git add src/components/AppNav.tsx
git commit -m "feat(nav): replace schedule tab with add+expenses tabs"
```

---

## Task 5: clientStore — addRouteStop accepts optional time

**Files:**
- Modify: `src/store/clientStore.ts:86` (interface) and `:393-411` (implementation)

- [ ] **Step 5.1: Update the `ClientState` interface signature for `addRouteStop`**

In `src/store/clientStore.ts`, find the interface line:
```ts
  addRouteStop: (input: { clientId: string; date: string }) => Promise<{ ok: true } | { ok: false; reason: string }>
```
Replace it with:
```ts
  addRouteStop: (input: { clientId: string; date: string; time?: string }) => Promise<{ ok: true } | { ok: false; reason: string }>
```

- [ ] **Step 5.2: Update the `addRouteStop` implementation**

Find the `addRouteStop` implementation in the store (starts at `addRouteStop: async ({ clientId, date }) =>`). Replace the entire function:

```ts
    addRouteStop: async ({ clientId, date, time }) => {
      const { userId, username } = get()
      if (!userId || !username) return { ok: false, reason: 'Not signed in.' }
      const sameDay = get().routeStops.filter((s) => s.date === date)
      if (sameDay.some((s) => s.clientId === clientId)) {
        return { ok: false, reason: 'That client is already on this route.' }
      }
      let sortOrder: number
      if (time) {
        const [h, m] = time.split(':').map(Number)
        sortOrder = (h ?? 0) * 60 + (m ?? 0)
      } else {
        sortOrder = sameDay.reduce((max, s) => Math.max(max, s.sortOrder), -1) + 1
      }
      try {
        const stop = await insertRouteStop(userId, username, { clientId, date, sortOrder })
        set((state) => ({ routeStops: [...state.routeStops, stop] }))
        persist()
        return { ok: true }
      } catch (error) {
        console.error('[store] addRouteStop failed:', error)
        const reason = error instanceof Error ? error.message : 'Could not add stop. Try again.'
        return { ok: false, reason }
      }
    },
```

- [ ] **Step 5.3: Commit**

```bash
git add src/store/clientStore.ts
git commit -m "feat(route): addRouteStop accepts time param for chronological sort order"
```

---

## Task 6: ClientList — remove appointments prop

**Files:**
- Modify: `src/components/ClientList.tsx`

- [ ] **Step 6.1: Remove appointments-related imports and helpers**

In `src/components/ClientList.tsx`:

1. Remove `type { Client, ScheduledSlot }` — change to `type { Client }` (remove `ScheduledSlot`):
```ts
import type { Client } from '../types/client'
```

2. Remove `Calendar` from the lucide-react import line. The import becomes:
```ts
import { CalendarClock, Clock3, FileText, Mail, MapPin, Pencil, Phone, Trash2, Check } from 'lucide-react'
```

3. Delete the two helper functions (lines 35–55):
```ts
// DELETE these two functions entirely:
function getNextAppointment(...) { ... }
function formatAppointmentDate(...) { ... }
```

- [ ] **Step 6.2: Remove `appointments` from the props interface**

Replace `ClientListProps`:
```ts
interface ClientListProps {
  clients: Client[]
  viewMode: 'cards' | 'table'
  onRemove: (client: Client) => void
  onEdit: (client: Client) => void
  onCompleteJob?: (client: Client) => void
  onInvoice?: (client: Client) => void
}
```

Update the function signature destructuring:
```ts
export function ClientList({ clients, viewMode, onRemove, onEdit, onCompleteJob, onInvoice }: ClientListProps) {
```

- [ ] **Step 6.3: Remove next-appointment badge from card view**

In the card view section, remove the `nextAppointment` variable and the badge block. Find and delete:
```tsx
const nextAppointment = getNextAppointment(client.id, appointments)
```
And delete the entire badge block:
```tsx
{nextAppointment && (
  <div
    className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
    style={{ backgroundColor: `rgba(var(--color-primary-light), 0.5)`, color: `rgb(var(--color-primary-dark))` }}
  >
    <Calendar className="h-4 w-4" />
    <span>{formatAppointmentDate(nextAppointment.date, nextAppointment.time)}</span>
  </div>
)}
```

- [ ] **Step 6.4: Remove next-appointment column from table view**

In the table view:

1. Remove the header cell:
```tsx
<th className="px-4 py-3 font-medium">Next visit</th>
```

2. Inside the `clients.map` for table rows, remove `const nextAppointment = getNextAppointment(client.id, appointments)` and the entire `<td>` that renders it:
```tsx
<td className="px-4 py-3 align-top text-slate-700">
  {nextAppointment ? (
    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: `rgb(var(--color-primary-dark))` }}>
      <Calendar className="h-3.5 w-3.5" />
      {formatAppointmentDate(nextAppointment.date, nextAppointment.time)}
    </span>
  ) : (
    <span className="text-xs text-slate-400">Not scheduled</span>
  )}
</td>
```

- [ ] **Step 6.5: Commit**

```bash
git add src/components/ClientList.tsx
git commit -m "feat(clients): remove next-appointment display from client list"
```

---

## Task 7: ClientForm — rename label

**Files:**
- Modify: `src/components/ClientForm.tsx:245`

- [ ] **Step 7.1: Change the checkbox label text**

Find the line:
```tsx
<span className={labelClass}>Schedule first appointment</span>
```
Replace it with:
```tsx
<span className={labelClass}>Schedule first visit</span>
```

- [ ] **Step 7.2: Commit**

```bash
git add src/components/ClientForm.tsx
git commit -m "feat(clients): rename 'Schedule first appointment' to 'Schedule first visit'"
```

---

## Task 8: AuthedApp — full restructure

**Files:**
- Modify: `src/AuthedApp.tsx`

This is the largest change. Work through each sub-step in order.

- [ ] **Step 8.1: Remove schedule/reminder imports**

Remove these import lines:
```ts
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { reminderScheduler, ReminderScheduler } from './services/reminderScheduler'
```

- [ ] **Step 8.2: Remove `appointments`-related store destructuring**

In the `useClientStore` destructuring block, remove these four lines:
```ts
    appointments,
    addAppointment,
    updateAppointment,
    removeAppointment,
```

- [ ] **Step 8.3: Remove the two reminder `useEffect` blocks**

Delete the following two `useEffect` calls entirely:

```ts
// DELETE this block:
useEffect(() => {
  if (!isLoaded) return
  void ReminderScheduler.requestPermission()
  reminderScheduler.start(appointments, clients, (client, appt) => {
    toast(`Upcoming: ${client.fullName}`, { description: `at ${appt.time}${client.address ? ` · ${client.address}` : ''}` })
  })
  return () => reminderScheduler.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isLoaded])

// DELETE this block:
useEffect(() => {
  if (isLoaded) reminderScheduler.updateData(appointments, clients)
}, [appointments, clients, isLoaded])
```

- [ ] **Step 8.4: Remove the schedule tour step**

In the `tourSteps` array, remove the entire step object:
```ts
// DELETE:
{
  selector: 'schedule',
  title: 'Schedule visits',
  body: 'Book appointments on the calendar and get a reminder about 30 minutes before each one.',
  onEnter: () => setTab('schedule'),
},
```

The tour now has 4 steps: welcome, home-stats, clients-add, guide-link.

- [ ] **Step 8.5: Update the `onSchedule` callback in the Clients tab's ClientForm**

The Clients tab currently has a `<ClientForm>` with an `onSchedule` prop. We'll remove this form from the Clients tab in the next step, but first identify this `onSchedule` callback — it will be reused in the Add tab:

```tsx
onSchedule={async (clientId, date, time) => {
  const result = await addRouteStop({ clientId, date, time })
  if (!result.ok) toast.error((result as { ok: false; reason: string }).reason)
}}
```

- [ ] **Step 8.6: Replace the `clients` tab content**

Find the `{tab === 'clients' && ( ... )}` block. Replace it so it contains only the search/list — removing `ClientForm` and `ExpensesCard`, and removing the `appointments` prop from both `ClientList` calls:

```tsx
{tab === 'clients' && (
  <>
    <SearchHero
      value={searchTerm}
      onChange={setSearchTerm}
      totalClients={recurringClients.length}
      visibleClients={filteredClients.length}
    />

    <GlowCard>
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {filteredClients.length === recurringClients.length
            ? `${recurringClients.length} ${recurringClients.length === 1 ? 'client' : 'clients'}`
            : `${filteredClients.length} of ${recurringClients.length}`}
        </p>
        <div className="inline-flex rounded-xl border border-slate-300 p-1">
          <ToggleButton active={viewMode === 'cards'} onClick={() => setViewMode('cards')}>
            Cards
          </ToggleButton>
          <ToggleButton active={viewMode === 'table'} onClick={() => setViewMode('table')}>
            Table
          </ToggleButton>
        </div>
      </div>
    </GlowCard>

    <ClientList
      clients={filteredClients}
      viewMode={viewMode}
      onRemove={setPendingDelete}
      onEdit={setEditingClient}
      onCompleteJob={handleCompleteJob}
      onInvoice={setInvoicingClient}
    />

    {filteredOneTime.length > 0 && (
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2 px-1">
          <h2 className="font-display text-xl font-semibold" style={{ color: 'rgb(var(--color-primary-dark))' }}>
            One-time clients
          </h2>
          <span className="text-xs font-medium text-slate-500">{oneTimeClientsAll.length}</span>
        </div>
        <ClientList
          clients={filteredOneTime}
          viewMode="cards"
          onRemove={setPendingDelete}
          onEdit={setEditingClient}
          onCompleteJob={handleCompleteJob}
          onInvoice={setInvoicingClient}
        />
      </div>
    )}
  </>
)}
```

- [ ] **Step 8.7: Remove the `{tab === 'schedule' && ...}` block**

Find and delete the entire block:
```tsx
{tab === 'schedule' && (
  <div data-tour="schedule">
    <ScheduleCalendar
      clients={clients}
      appointments={appointments}
      onAdd={(input) => addAppointment(input)}
      onUpdate={(id, input) => updateAppointment(id, input)}
      onRemove={(id) => void removeAppointment(id)}
    />
  </div>
)}
```

- [ ] **Step 8.8: Add the `add` tab block (after the `home` tab block)**

Insert this new block after `{tab === 'home' && ( ... )}` and before `{tab === 'clients' && ( ... )}`:

```tsx
{tab === 'add' && (
  <div data-tour="clients-add">
    <ClientForm
      onSubmit={addClient}
      onSchedule={async (clientId, date, time) => {
        const result = await addRouteStop({ clientId, date, time })
        if (!result.ok) toast.error((result as { ok: false; reason: string }).reason)
      }}
      atLimit={atClientLimit}
      onUpgradeRequired={() => setView('upgrade')}
    />
  </div>
)}
```

- [ ] **Step 8.9: Add the `expenses` tab block (after the `route` tab block)**

Insert this block after `{tab === 'route' && ( ... )}` and before `{tab === 'more' && ( ... )}`:

```tsx
{tab === 'expenses' && (
  <ExpensesCard />
)}
```

- [ ] **Step 8.10: Move the `data-tour="clients-add"` wrapper**

The `data-tour="clients-add"` attribute was on the ClientForm in the old Clients tab. It is now on the Add tab's ClientForm (already included in Step 8.8 above). Verify no duplicate `data-tour="clients-add"` exists in the file after the edit.

- [ ] **Step 8.11: Commit**

```bash
git add src/AuthedApp.tsx
git commit -m "feat(nav): add Add+Expenses tabs, remove Schedule tab and reminder scheduler"
```

---

## Task 9: InvoiceTemplatePage — color picker + live preview

**Files:**
- Modify: `src/pages/InvoiceTemplatePage.tsx`

- [ ] **Step 9.1: Add new imports**

Add to the existing import block at the top of `src/pages/InvoiceTemplatePage.tsx`:

```ts
import { useMemo } from 'react'
import { fillTemplate, renderInvoiceHtml, rgbStringToHex } from '../lib/invoice'
import { colorThemes } from '../lib/colorThemes'
import { useTheme } from '../contexts/ThemeContext'
```

The existing imports (`useState`, `toast`, `SettingsPage`, `GlowCard`, `DEFAULT_INVOICE_TEMPLATE`, `INVOICE_PLACEHOLDERS`, `inputClass`, `labelClass`, `ghostButtonClass`, `primaryButtonClass`, `primaryButtonStyle`, `cn`, `updateProfileInvoiceSettings`, `useAuth`) are kept as-is.

- [ ] **Step 9.2: Add `useTheme` and `accentColor` state**

Inside `InvoiceTemplatePage`, after the existing state declarations (`businessName`, `template`, `saving`), add:

```ts
const { colorTheme } = useTheme()
const [accentColor, setAccentColor] = useState<string>(
  () => profile?.invoice_accent_color ?? rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark),
)
```

- [ ] **Step 9.3: Add the preview HTML memo**

After the `accentColor` state, add:

```ts
const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
const previewHtml = useMemo(
  () =>
    renderInvoiceHtml({
      businessName: businessName.trim() || 'My Business',
      clientName: 'Alex Johnson',
      amount: '$50.00',
      service: 'Lawn service',
      date: today,
      message: fillTemplate(template, {
        client: 'Alex Johnson',
        business: businessName.trim() || 'My Business',
        service: 'Lawn service',
        date: today,
        amount: '$50.00',
      }),
      accentDark: accentColor,
    }),
  [businessName, template, accentColor, today],
)
```

- [ ] **Step 9.4: Update the `save` function to include `invoiceAccentColor`**

Replace the `save` function:

```ts
const save = async () => {
  if (!user) return
  setSaving(true)
  try {
    await updateProfileInvoiceSettings(user.id, {
      businessName: businessName.trim() || null,
      invoiceTemplate: template.trim() || null,
      invoiceAccentColor: accentColor,
    })
    await refreshProfile()
    toast.success('Invoice settings saved')
  } catch {
    toast.error('Could not save. Try again.')
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 9.5: Add the color picker field after the business name input**

In the JSX, after the `<label>` block for "Business name" and before the `<label>` block for "Default invoice message", insert:

```tsx
<label className="space-y-1.5">
  <span className={labelClass}>Email header colour</span>
  <div className="flex items-center gap-3">
    <input
      type="color"
      value={accentColor}
      onChange={(e) => setAccentColor(e.target.value)}
      className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
    />
    <span className="text-sm text-slate-500">{accentColor}</span>
    <button
      type="button"
      onClick={() => setAccentColor(rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark))}
      className={ghostButtonClass}
    >
      Reset to theme
    </button>
  </div>
</label>
```

- [ ] **Step 9.6: Add the live preview section after the message textarea label**

After the closing `</label>` of the "Default invoice message" textarea, and before the placeholders `<div>`, insert:

```tsx
<div className="space-y-1.5">
  <span className={labelClass}>Preview</span>
  <p className="text-xs text-slate-500">
    Sample data — your client's real details will fill in when you send.
  </p>
  <iframe
    title="Invoice email preview"
    srcDoc={previewHtml}
    sandbox=""
    className="h-80 w-full rounded-xl border border-slate-200 bg-white"
  />
</div>
```

- [ ] **Step 9.7: Commit**

```bash
git add src/pages/InvoiceTemplatePage.tsx
git commit -m "feat(invoice): add color picker and live HTML preview to invoice settings"
```

---

## Task 10: InvoiceDialog — prefer profile invoice color

**Files:**
- Modify: `src/components/InvoiceDialog.tsx:38-40`

- [ ] **Step 10.1: Update `accentDark` derivation**

In `src/components/InvoiceDialog.tsx`, find the line:
```ts
const accentDark = rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark)
```
Replace it with:
```ts
const accentDark =
  profile?.invoice_accent_color ??
  rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark)
```

- [ ] **Step 10.2: Commit**

```bash
git add src/components/InvoiceDialog.tsx
git commit -m "feat(invoice): use profile invoice_accent_color in InvoiceDialog when set"
```

---

## Task 11: Verify the full feature set

- [ ] **Step 11.1: Start the dev server**

```bash
cd client-tracker-app && npm run dev
```

- [ ] **Step 11.2: Check the 6-tab navigation**

- Bottom nav (mobile viewport) shows: Home | Add | Clients | Route | Expenses | More
- Desktop top nav shows the same 6 tabs as pills
- No "Schedule" tab visible anywhere

- [ ] **Step 11.3: Check the Add tab**

- Tap "Add" — ClientForm appears
- Fill in client name + address + check "Schedule first visit" + pick a date and time
- Submit → toast "Client added" appears
- Switch to Route tab → navigate to the scheduled date → the client appears as a stop in correct time order

- [ ] **Step 11.4: Check the Clients tab**

- No ClientForm at the bottom
- No ExpensesCard
- Client cards show no "next appointment" badge
- Table view has no "Next visit" column

- [ ] **Step 11.5: Check the Expenses tab**

- Tap "Expenses" → ExpensesCard renders correctly
- Can add/remove expenses as before

- [ ] **Step 11.6: Check the Route tab**

- Schedule two clients at different times (e.g. 09:00 and 14:00) for the same date via the Add tab
- Open Route tab → navigate to that date → stops appear with the 09:00 client first

- [ ] **Step 11.7: Check invoice settings**

- More → Invoices
- Color picker renders with the current theme color pre-selected
- Changing the color updates the preview iframe in real time
- Changing the message text updates the preview in real time
- Save → open InvoiceDialog for a client → the banner uses the saved color

- [ ] **Step 11.8: Check new default invoice template**

- Create a new account or check that `DEFAULT_INVOICE_TEMPLATE` in `lib/invoice.ts` shows the new text
- In InvoiceDialog → message textarea → "Reset to template" should show the new template text

- [ ] **Step 11.9: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: cleanup after nav/route/invoice redesign"
```
