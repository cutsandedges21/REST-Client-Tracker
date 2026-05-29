// Shared class strings for a consistent, mobile-first look.
// Inputs use a 16px base font size to stop iOS Safari from auto-zooming on focus.

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]'

export const labelClass = 'text-sm font-medium text-slate-700'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'

export const ghostButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100'

/** Inline style for theme-colored primary buttons. */
export const primaryButtonStyle = { backgroundColor: 'rgb(var(--color-primary))' }
