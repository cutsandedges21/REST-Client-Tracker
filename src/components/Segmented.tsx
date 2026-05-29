type Option<T extends string> = { value: T; label: string }

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  ariaLabel?: string
  className?: string
}

/** Compact pill toggle used for $/% and minutes/hours choices. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 rounded-xl border border-slate-300 bg-white p-1 ${className ?? ''}`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
            style={active ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
