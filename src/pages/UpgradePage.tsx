import { Check, Sparkles } from 'lucide-react'
import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { PLANS, type Plan, type PlanId } from '../lib/plans'

type UpgradePageProps = {
  currentPlan: PlanId
  onUpgrade: (plan: PlanId) => void
  onBack: () => void
}

export function UpgradePage({ currentPlan, onUpgrade, onBack }: UpgradePageProps) {
  return (
    <SettingsPage title="Upgrade Plan" onBack={onBack}>
      <GlowCard>
        <div className="p-5 md:p-6">
          <p className="text-sm text-slate-600">
            Pick the plan that fits how you work. Upgrade or downgrade any time.
          </p>
        </div>
      </GlowCard>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const currentIndex = PLANS.findIndex((p) => p.id === currentPlan)
          const planIndex = PLANS.findIndex((p) => p.id === plan.id)
          const direction =
            plan.id === currentPlan
              ? 'current'
              : planIndex > currentIndex
                ? 'upgrade'
                : 'downgrade'
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              direction={direction}
              onAction={() => onUpgrade(plan.id)}
            />
          )
        })}
      </div>
    </SettingsPage>
  )
}

type PlanCardProps = {
  plan: Plan
  direction: 'current' | 'upgrade' | 'downgrade'
  onAction: () => void
}

function PlanCard({ plan, direction, onAction }: PlanCardProps) {
  const isCurrent = direction === 'current'
  const ctaLabel =
    direction === 'upgrade' ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`
  return (
    <div className="relative h-full">
      {plan.highlight && (
        <div
          className="absolute -top-3 right-4 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-md"
          style={{ backgroundColor: `rgb(var(--color-primary-dark))` }}
        >
          <Sparkles className="h-3 w-3" />
          Most Popular
        </div>
      )}
      <GlowCard className="h-full">
        <div
          className={`flex h-full flex-col p-5 md:p-6 ${
            plan.highlight ? 'ring-2 ring-[rgb(var(--color-primary))]' : ''
          } rounded-2xl`}
        >
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-lg font-semibold tracking-tight"
              style={{ color: `rgb(var(--color-primary-dark))` }}
            >
              {plan.name}
            </h3>
            {isCurrent && (
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  color: `rgb(var(--color-primary-dark))`,
                  borderColor: `rgb(var(--color-primary-dark))`,
                }}
              >
                Current Plan
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{plan.priceLabel}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{plan.tagline}</p>

          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {plan.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-slate-700">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: `rgb(var(--color-primary))` }}
                />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            {isCurrent ? (
              <button
                type="button"
                disabled
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500"
              >
                Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
                style={{ backgroundColor: `rgb(var(--color-primary))` }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = `rgb(var(--color-primary-dark))`)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = `rgb(var(--color-primary))`)
                }
              >
                {ctaLabel}
              </button>
            )}
          </div>
        </div>
      </GlowCard>
    </div>
  )
}
