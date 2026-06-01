# Nav / Route / Invoice Redesign — Design Spec
Date: 2026-06-01

## Overview
Five coordinated changes to the REST client-tracker app:
1. Replace Schedule tab → Expenses tab
2. Schedule → auto-populate Route (create RouteStop on schedule)
3. Add a dedicated "Add" tab (client form only)
4. Rename "Clients" tab — becomes the list-only view (keeps name "Clients")
5. Invoice email: live preview + color picker in settings + new default template

---

## 1. Navigation

**Before:** `Home | Clients | Route | Schedule | More`
**After:** `Home | Add | Clients | Route | Expenses | More`

- `AppTab` type: `'home' | 'add' | 'clients' | 'route' | 'expenses' | 'more'`
- AppNav ITEMS:
  | Tab | Label | Icon |
  |---|---|---|
  | home | Home | Home |
  | add | Add | UserPlus |
  | clients | Clients | Users |
  | route | Route | Route |
  | expenses | Expenses | Receipt |
  | more | More | Menu |
- Remove `CalendarDays` import; add `UserPlus`, `Receipt`.
- Default tab on load remains `'home'`.

---

## 2. Expenses Tab

- `{tab === 'expenses' && <ExpensesCard />}` added to AuthedApp's tab render.
- `<ExpensesCard />` removed from the Clients tab render.
- No other changes to `ExpensesCard`.

---

## 3. Add Tab

- `{tab === 'add' && (...)}` renders the Add Client form section only.
- Content is identical to the current Clients tab's add-client block:
  - `<ClientForm onSubmit={addClient} onSchedule={...} atLimit={atClientLimit} onUpgradeRequired={() => setView('upgrade')} />`
- The `onSchedule` handler here is updated (see Section 4 below).

---

## 4. Clients Tab

- Retains the name **"Clients"** — now list-only.
- Renders: SearchHero, view-mode toggle GlowCard, `<ClientList>`, one-time clients section.
- `<ClientForm>` and `<ExpensesCard>` are removed from this tab.
- `appointments` prop removed from `<ClientList>` call (and from ClientList component if it's only used for "next appointment" display — that feature is dropped with the schedule system).

---

## 5. Schedule → Route Auto-population

### Flow
When the user checks "Schedule first visit" in ClientForm and submits:
1. Client is created → `clientId` returned.
2. `onSchedule(clientId, date, time)` is called.
3. This calls `addRouteStop({ clientId, date, time })` — **not** `addAppointment`.
4. The route stop's `sortOrder` is set to minutes-since-midnight from `time` (e.g. `"09:30"` → `570`).
5. On the Route page for that date, the stop appears in chronological order.

### ClientForm change
- Label: "Schedule first appointment" → **"Schedule first visit"**
- Behaviour unchanged; wiring changes in AuthedApp.

### `addRouteStop` signature change
```ts
addRouteStop(input: { clientId: string; date: string; time?: string })
```
- When `time` is provided, `sortOrder = hours * 60 + minutes`.
- When omitted (manual add from Route page), existing max-sortOrder-plus-1 logic is used.

### Cleanup
- `ScheduleCalendar` removed from AuthedApp (no longer rendered or imported).
- `reminderScheduler` removed from AuthedApp (was appointment-driven).
- `appointments`, `addAppointment`, `updateAppointment`, `removeAppointment` removed from AuthedApp's store destructuring and all render usage.
- Onboarding tour step for "Schedule" removed (tour becomes 4 steps).
- `ScheduledSlot` DB table and store code left in place — no migration, existing data preserved.

---

## 6. Invoice Email Editor

### InvoiceTemplatePage additions

**Email header color picker**
- `<input type="color" />` field, labelled "Email header colour".
- Placed below the business name field.
- Initial value: `profile.invoice_accent_color` if set, else the current theme's `accentDark` hex (computed via `rgbStringToHex`).
- Saved alongside business name and template in `updateProfileInvoiceSettings`.

**Live preview**
- `<iframe srcDoc={html} sandbox="" />` below the message textarea (same as InvoiceDialog).
- Preview data: `client="Alex Johnson"`, `amount="$50.00"`, `service="Lawn service"`, `date=today`.
- `html` recomputed via `renderInvoiceHtml(...)` whenever `businessName`, `template`, or `accentColor` changes.
- Height: `h-80` (slightly taller than InvoiceDialog's `h-72` since this is a settings page).

### DB migration
```sql
ALTER TABLE profiles ADD COLUMN invoice_accent_color TEXT;
```
Applied via Supabase MCP `apply_migration`.

### `updateProfileInvoiceSettings` (api.ts)
Add `invoiceAccentColor: string | null` to the payload and write it to `invoice_accent_color`.

### InvoiceDialog change
```ts
const accentDark = profile?.invoice_accent_color
  ?? rgbStringToHex(colorThemes[colorTheme].rgb.primaryDark)
```
Falls back to theme colour when unset (identical to current behaviour for existing users).

### Profile type
Add `invoice_accent_color?: string | null` to the profile type/interface.

---

## 7. Default Invoice Template

Replace `DEFAULT_INVOICE_TEMPLATE` in `lib/invoice.ts`:

```
Hi {{client}},

Thanks for your business! Here is your invoice from {{business}}.

Service: {{service}}
Date: {{date}}
Amount due: {{amount}}

Payment can be made by cash, e-transfer, or cheque. Reply to this email with any questions.

Thank you,
{{business}}
```

---

## Files Changed

| File | Change |
|---|---|
| `src/components/AppNav.tsx` | New tabs: add, expenses; remove schedule |
| `src/AuthedApp.tsx` | New tab renders; updated onSchedule; remove schedule/reminders |
| `src/components/ClientForm.tsx` | Rename label |
| `src/components/ClientList.tsx` | Remove appointments prop (and any next-appointment display) |
| `src/store/clientStore.ts` | addRouteStop accepts optional time; sortOrder from time |
| `src/pages/InvoiceTemplatePage.tsx` | Color picker + live preview |
| `src/lib/api.ts` | updateProfileInvoiceSettings writes invoice_accent_color |
| `src/lib/invoice.ts` | New DEFAULT_INVOICE_TEMPLATE |
| `src/components/InvoiceDialog.tsx` | Use profile.invoice_accent_color when set |
| `src/contexts/AuthContext.tsx` | Add invoice_accent_color to profile type |
| Supabase migration | ADD COLUMN invoice_accent_color TEXT |
