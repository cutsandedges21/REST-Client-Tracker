import type { ReactNode } from 'react'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Compass,
  CreditCard,
  FileText,
  Lightbulb,
  PlayCircle,
  Receipt,
  UserPlus,
} from 'lucide-react'
import { SettingsPage } from '../components/SettingsPage'
import { GlowCard } from '../components/GlowCard'
import { ghostButtonClass } from '../lib/ui'

type GuidePageProps = {
  onBack: () => void
  onReplayTour?: () => void
}

export function GuidePage({ onBack, onReplayTour }: GuidePageProps) {
  return (
    <SettingsPage title="How to use REST" onBack={onBack}>
      <GlowCard>
        <div className="p-5 md:p-6">
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'rgb(var(--color-primary-dark))' }}>
            Welcome to REST
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            REST is your whole service business in one place — <Strong>R</Strong>evenue, <Strong>E</Strong>mail,{' '}
            <Strong>S</Strong>chedule, <Strong>T</Strong>rack. Add your clients, log the work you do, watch your
            real profit, schedule visits, and send invoices — all from your phone. Tap any section below to learn more.
          </p>
          {onReplayTour && (
            <button type="button" onClick={onReplayTour} className={`${ghostButtonClass} mt-4`}>
              <PlayCircle className="h-4 w-4" style={{ color: 'rgb(var(--color-primary))' }} />
              Replay the guided tour
            </button>
          )}
        </div>
      </GlowCard>

      <Section icon={Compass} title="Getting around">
        <p>There are four tabs along the bottom (or the top on a computer):</p>
        <ul>
          <li><B>Home</B> — your numbers at a glance: all-time profit, this month's projection, and charts.</li>
          <li><B>Clients</B> — add, search, edit, invoice and remove clients; track expenses.</li>
          <li><B>Schedule</B> — a calendar of upcoming visits.</li>
          <li><B>More</B> — settings, invoices, your plan, and this guide.</li>
        </ul>
      </Section>

      <Section icon={UserPlus} title="Adding & managing clients">
        <p>On the <B>Clients</B> tab, scroll to <B>Add client</B> and fill in:</p>
        <ul>
          <li><B>Rate per visit</B> — what you charge each time.</li>
          <li>
            <B>Service frequency</B> — Weekly, Bi-weekly, Monthly, Every 6 weeks, Every 2 months, or{' '}
            <B>One-time</B> for a single job. This drives your monthly projection.
          </li>
          <li>
            <B>Expense per visit</B> — your cost for that client. Toggle <B>$</B> for a flat dollar amount or{' '}
            <B>%</B> to make it a percentage of the rate.
          </li>
          <li><B>Service duration</B> — how long the visit takes (used for your hourly rate). Switch between Min/Hr.</li>
        </ul>
        <p>
          Each client card has quick actions: <B>edit</B> (pencil), <B>invoice</B> (document), <B>log a job</B>{' '}
          (check), and <B>remove</B> (trash — with an Undo button if you tap it by mistake). Use the search box to
          filter, and the <B>Cards / Table</B> toggle to switch the layout.
        </p>
      </Section>

      <Section icon={BarChart3} title="Understanding your numbers (Home)">
        <p>The <B>All-time</B> card is built from every job you've logged plus your expenses:</p>
        <ul>
          <li><B>Total earnings</B> — everything you've made.</li>
          <li><B>Net profit</B> — earnings minus all expenses.</li>
          <li><B>Hourly rate</B> — earnings ÷ hours worked.</li>
          <li><B>Profit margin</B> — what share of your revenue is profit (profit ÷ earnings).</li>
          <li><B>Markup</B> — how much you make on top of your costs (profit ÷ expenses). 900% means $9 profit for every $1 spent.</li>
        </ul>
        <p>
          Below that, the <B>monthly projection</B> estimates revenue and time based on each client's frequency, and
          the charts show profit trends and revenue per client.
        </p>
      </Section>

      <Section icon={CheckCircle2} title="Logging completed jobs">
        <p>
          When you finish a visit, tap the <B>check</B> icon on that client's card and confirm the earnings, time, and
          expenses (it pre-fills from their profile, so usually you just hit save). Logged jobs are what power your
          All-time stats, hourly rate, and the profit chart — so log them as you go.
        </p>
      </Section>

      <Section icon={Receipt} title="Tracking expenses">
        <p>
          On the <B>Clients</B> tab, the <B>Expenses</B> card is for business costs that aren't tied to one client —
          gas, blades, string, equipment, etc. Add a description and amount; they're subtracted from your profit and
          factored into your margin and markup. Tap the trash icon to remove one (with Undo).
        </p>
      </Section>

      <Section icon={CalendarDays} title="Scheduling & reminders">
        <p>
          Use the <B>Schedule</B> tab to book visits on the calendar, or tick <B>"Schedule first appointment"</B> when
          adding a client. Upcoming visits appear right on the client's card. REST gives you a heads-up about 30
          minutes before an appointment (allow notifications when asked for a pop-up reminder).
        </p>
      </Section>

      <Section icon={FileText} title="Sending invoices">
        <p>
          Tap the <B>document</B> icon on a client to open an invoice. Fill in the amount, date, and service — the
          message is written for you — then tap <B>Open in email app</B>. It hands off to your own email
          (Gmail, Mail, etc.) with everything pre-filled, so you just press send. Nothing is sent until you do.
        </p>
        <p>
          Set your <B>business name</B> and edit the <B>default message</B> once under <B>More → Invoices</B>.
          Placeholders like <Code>{'{{client}}'}</Code> and <Code>{'{{amount}}'}</Code> fill in automatically.
        </p>
      </Section>

      <Section icon={CreditCard} title="Themes & plans">
        <p>
          <B>More → Theme</B> switches between light/dark and six accent colours. <B>More → Plan</B> shows your
          current plan and upgrade options (Free covers up to 3 clients; Pro and Enterprise are unlimited).
        </p>
      </Section>

      <Section icon={Lightbulb} title="Tips & FAQ">
        <ul>
          <li><B>Margin vs. markup?</B> Margin is profit as a share of what you charged; markup is profit compared to what it cost you.</li>
          <li><B>One-time customer?</B> Add them as a client with the <B>One-time</B> frequency — they show in your list but don't add to monthly projections.</li>
          <li><B>Will my data follow me?</B> Yes — everything is saved to your account, so it's there on any device when you sign in.</li>
          <li><B>Made a mistake deleting?</B> Most deletes show an <B>Undo</B> button for a few seconds.</li>
        </ul>
      </Section>

      <div className="h-2" />
    </SettingsPage>
  )
}

function Section({ icon: Icon, title, children }: { icon: typeof Compass; title: string; children: ReactNode }) {
  return (
    <GlowCard>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: 'rgba(var(--color-primary-light), 0.9)', color: 'rgb(var(--color-primary-dark))' }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className="flex-1 font-display text-lg font-semibold text-slate-900">{title}</span>
          <ChevronDown className="h-5 w-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-slate-600 [&_li]:ml-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>
      </details>
    </GlowCard>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <span style={{ color: 'rgb(var(--color-primary-dark))', fontWeight: 700 }}>{children}</span>
}

function B({ children }: { children: ReactNode }) {
  return (
    <b className="font-semibold" style={{ color: 'rgb(var(--color-primary-dark))' }}>
      {children}
    </b>
  )
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs" style={{ color: 'rgb(var(--color-primary-dark))' }}>
      {children}
    </code>
  )
}
