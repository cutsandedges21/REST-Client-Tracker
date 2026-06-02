# Client card density views — design

Date: 2026-06-02

## Problem

On the Clients page, recurring clients render as full cards stacked one per row.
With many clients this requires a lot of scrolling. Users want denser layouts
while keeping the rich full card available on demand.

## Goal

Add three density options for the **Cards** view on the Clients page:

| Density | Phone cols | Tablet/Desktop cols | Card content |
| --- | --- | --- | --- |
| **Full** (default) | 1 | 1 | Existing full card (unchanged) |
| **Grid** | 2 | 2 | Name · price · frequency |
| **Compact** | 3 | 4 | Name · price |

Tapping a small (Grid/Compact) card opens the **full card** in a focused overlay.

Out of scope: the Table view (unchanged), persistence across reloads (session-only,
matching the existing Cards/Table toggle).

## Design

### State

Add to `clientStore`, alongside `viewMode`:

- `cardDensity: CardDensity` where `type CardDensity = 'full' | 'grid' | 'compact'`,
  default `'full'`.
- `setCardDensity(density: CardDensity): void`.

Session-only (not written to the persisted snapshot), exactly like `viewMode`.

### Control (AuthedApp clients header)

Keep the existing `[ Cards | Table ]` toggle. When `viewMode === 'cards'`, render a
3-button icon group beside it:

```
N clients        [ ☐ Full | ▦ Grid | ▥ Compact ]   [ Cards | Table ]
```

- Icon-only buttons with `aria-label`s ("Full view", "Grid view", "Compact view"),
  reusing the existing pill/toggle styling (active = primary color).
- Hidden when `viewMode === 'table'`.
- Wraps gracefully on narrow screens.

### Rendering (ClientList)

`ClientList` gains a `density?: CardDensity` prop (default `'full'`). The cards branch:

- Wrapper grid column classes by density:
  - full: `grid-cols-1`
  - grid: `grid-cols-2`
  - compact: `grid-cols-3 sm:grid-cols-4`
  - gaps tighten for denser layouts (e.g. `gap-4` / `gap-3` / `gap-2`).
- `full` density renders the existing full card per item (unchanged behavior).
- `grid` / `compact` density render a new `CompactClientCard`:
  - Grid: name, `formatCurrency(client.perCutRate)`, `serviceFrequencyLabels[...]`.
  - Compact: name + price only (frequency omitted to stay legible in tight cells).
  - The whole card is a button (`aria-label`) that opens the overlay; no inline
    action icons in the small variant.

To avoid duplicating the full-card markup between the Full-density list and the
overlay, extract the card's inner content into a reusable piece (e.g.
`ClientCardBody`) used by both. `CompactClientCard` is its own small component.

### Expand → focused overlay

`ClientList` owns its expand state internally (`expanded: Client | null`), since it
already holds the client data and the action callbacks. There are two `ClientList`
instances (recurring + one-time); each manages its own overlay.

- Clicking a small card sets `expanded`.
- Overlay: `fixed inset-0 z-50` dimmed + blurred backdrop, centered scrollable
  container holding the **full card** body plus the action buttons (Edit, Invoice,
  Log job, Delete).
- Close on backdrop click, ✕ button, or `Escape`. Body scroll locks while open.
- framer-motion shared layout (`layoutId={`client-card-${client.id}`}`) so the small
  card morphs into the full card. Respect `useReducedMotionSafe` → fall back to a
  plain fade when reduced motion is preferred.
- Action handlers reuse the existing props (`onEdit`, `onInvoice`, `onCompleteJob`,
  `onRemove`). Triggering Edit/Invoice/Log job closes the overlay and opens that
  dialog as today; Delete closes the overlay and opens the delete confirm.

### Wiring (AuthedApp)

- Read `cardDensity` / `setCardDensity` from the store.
- Render the density control in the clients header (cards mode only).
- Pass `density={cardDensity}` to both the recurring and one-time `ClientList`
  instances so they match.

## Files

- `src/store/clientStore.ts` — `cardDensity` state + `setCardDensity`, `CardDensity` type.
- `src/components/ClientList.tsx` — `density` prop, grid columns, full vs compact
  rendering, internal expand overlay; extract `ClientCardBody` + `CompactClientCard`.
- `src/AuthedApp.tsx` — density control in header + wiring.
- (New small components may live in `ClientList.tsx` or sibling files.)

## Edge cases

- Empty state: unchanged.
- Table view: density control hidden; `density` ignored.
- Reduced motion: overlay uses fade, no layout morph.
- One-time clients: same density applies; net/expense detail only shown on expand.
