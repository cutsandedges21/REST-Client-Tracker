# Marketing Homepage & Pre-Auth Routing — Design

**Date:** 2026-05-08
**Status:** Approved (pending user review of this written spec)
**Author:** Brainstormed with Claude

## Problem

The app currently shows `<LoginScreen />` to any unauthenticated visitor. There is no marketing surface that explains what REST is, who it's for, or why someone should sign up. The visual style of the existing site reads as generic / "AI-templated" — bland gradients, default Tailwind defaults, no narrative momentum.

We want a public marketing homepage at `/` that:

1. Communicates what REST is (a client tracker for solo trades — Revenue, Email, Schedule, Track) in a way tied to the existing brand mark.
2. Looks distinctive — heavy use of motion design (Framer Motion for component-level animations, GSAP for the scroll-stacked sections) so the page feels alive and crafted, not templated.
3. Lets visitors sign up or sign in from the marketing site.
4. Doesn't break or visually alter the authenticated dashboard.

## Goals

- Public landing page at `/` with full hero, four feature sections (one per REST letter), how-it-works, pricing, final CTA, footer.
- React Router-based routing — real URLs for `/`, `/login`, `/signup`, `/app/*`.
- Authenticated app (everything currently in `App.tsx`) lives behind `/app/*` and is gated by an auth guard that redirects to `/login`.
- Heavy animation budget for the marketing page (scroll-driven, on-load stagger, in-view reveals, looping mockup demos), all reduced-motion safe.
- Pricing data on the landing page comes from the existing `src/lib/plans.ts` — no duplication.

## Non-Goals

- No changes to the authed dashboard's visuals, components, or behavior.
- No Stripe checkout wiring on pricing CTAs — they route to `/signup` (with `?plan=pro` query param wired but not yet consumed by `LoginScreen`).
- No new auth flows (email verification, password reset, OAuth) — login/signup keep their current behavior.
- No SEO meta tags / OG images — out of scope.
- No analytics events.
- No internationalization — English only, matching the rest of the app.

## Architecture

### New dependencies

- `react-router-dom` — real URL-based routing across the app.
- `gsap` + `@gsap/react` — powers the scroll-pinned, rotation-stacked feature sections. Combined ~50 KB gzipped.

### Route map

| Route | Component | Auth |
|---|---|---|
| `/` | `<Landing />` | Public |
| `/login` | `<LoginScreen />` (existing, reused) | Public |
| `/signup` | `<LoginScreen mode="signup" />` (same component, defaults to register tab) | Public |
| `/app/*` | `<AuthedApp />` (current `App.tsx` body) | `<AuthGuard>` redirects to `/login` if unauthed |

`<AuthGuard>` reads the existing `localStorage` `userAuth` token + Zustand store; no new auth state.

The existing in-app `view` state (theme/email/account/upgrade) is **not** split into separate routes — it stays as it is. `/app` is a single wrapped route. Keeps this work focused on the marketing site.

### File layout (new files)

```
src/
  router.tsx                          ← createBrowserRouter setup, AuthGuard
  pages/
    Landing.tsx                       ← composes the full landing page
  components/
    landing/
      LandingNav.tsx                  ← sticky top nav: logo, Sign in, Get started
      Hero.tsx                        ← rotating-word hero (Framer Motion)
      FlowArt.tsx                     ← GSAP scroll-stack engine
      FlowSection.tsx                 ← single stacked section primitive
      sections/
        RevenueSection.tsx
        EmailSection.tsx
        ScheduleSection.tsx
        TrackSection.tsx
      mockups/
        RevenueMockup.tsx             ← animated bar chart + counter
        EmailMockup.tsx               ← phone-frame email card
        ScheduleMockup.tsx            ← mini week calendar with chips
        TrackMockup.tsx               ← animated client-card stack with search
      HowItWorks.tsx                  ← 3-step section
      LandingPricing.tsx              ← pulls PLANS from src/lib/plans.ts
      FinalCTA.tsx
      LandingFooter.tsx
  components/
    RestMark.tsx                      ← extracted from App.tsx header for reuse
  hooks/
    useReducedMotionSafe.ts           ← Framer Motion useReducedMotion + matchMedia
```

`<RestMark />` is extracted from the current `App.tsx` header so the landing nav, the landing footer, and the authed header all share a single source of truth for the R-E-S-T letter mark. The authed header should look identical after extraction.

## Page content

### Sticky top nav (`LandingNav`)

- Left: `<RestMark size="sm" />`.
- Right: `Sign in` (text link → `/login`) + `Get started` (filled button → `/signup`).
- Background: transparent at top, fades to `bg-white/70 dark:bg-zinc-950/70 backdrop-blur` once scrolled > 40 px (Framer Motion `useScroll` + `useTransform`).

### Hero

Adapted from the user-provided 21st.dev snippet, themed to the existing palette.

- Top pill button: `Now in beta — read the launch note` (anchors to `#features`).
- Headline: `The smarter way to manage` + rotating word.
- Rotation set: `clients`, `cuts`, `revenue`, `routes`, `reminders` (2 s interval, spring transition, y-axis swap).
- Subheading: *"REST is the all-in-one client tracker for solo trades. Track every cut, schedule every job, send every reminder, and watch your revenue grow — without the spreadsheet chaos."*
- CTAs: `Get started free` (primary, → `/signup`) and `See how it works` (outline, anchor → `#features`).
- Static headline text uses `rgb(var(--color-primary-dark))`. Rotating word uses solid theme color. Buttons use existing primary / dark tokens.
- The existing `<AnimatedBackground />` blob component sits behind the hero.

### Feature header slab

Just before the FlowArt block:

> *"R-E-S-T. Four letters. One workflow."*

Each letter animates in on view with stagger.

### FlowSections — `#features`

Two-column layout (single column on mobile): label + headline + body on one side, animated mockup on the other.

1. **Revenue** — *"Know what you're actually earning."*
   - Body: per-cut rates, recurring frequencies, expenses, and one-time tasks all roll up into a live monthly profit number. No more guessing.
   - Mockup: `RevenueMockup` — animated bar chart, counting profit number.

2. **Email** — *"Reminders that send themselves."*
   - Body: clients get auto-reminders before each appointment via Gmail or EmailJS. No more "did I confirm Tuesday?"
   - Mockup: `EmailMockup` — phone frame with email card sliding in, then "Sent" check.

3. **Schedule** — *"A calendar built for the route, not the office."*
   - Body: drag, drop, reschedule. Conflicts caught automatically. Recurring jobs auto-populate the week.
   - Mockup: `ScheduleMockup` — week-grid with appointment chips fading in, one chip animating across days.

4. **Track** — *"Every client. Every detail. Always with you."*
   - Body: contact info, addresses, service history, notes, and per-client profitability — searchable in a tap.
   - Mockup: `TrackMockup` — stacked client cards, animated search field filtering with FLIP-style reorder.

### How It Works — `#how`

Three numbered cards, fade-up on scroll with stagger:

1. *Add your clients* — Drop in name, address, rate, and how often you visit.
2. *Schedule the work* — REST handles recurrence, conflicts, and reminders.
3. *Get paid, see the math* — Complete jobs in one tap. Watch profit roll in.

### Pricing — `#pricing`

Heading: *"Start free. Scale when you're ready."*

- Cards rendered from `PLANS` in `src/lib/plans.ts` (Free / Pro / Enterprise).
- Reuses the existing `<GlowCard>` primitive so cards visually match the authed app.
- "Most Popular" badge stays on Pro (driven by `plan.highlight`).
- All CTAs route to `/signup?plan=<id>`. The query param is wired for future Stripe integration but not consumed yet.

### Final CTA

Centered block:

> *"Stop tracking clients on paper."*
> [`Get started free` button → `/signup`]

Background uses the same animated blob style already in the app, slightly brighter.

### Footer

Copyright, small `<RestMark size="xs" />`, links: `Sign in`, `Pricing` (anchor), `Contact` (mailto). Nothing else — no fake social icons.

## Animation plan

**Rule:** GSAP only powers the FlowSection scroll-stack. Everything else is Framer Motion. No new CSS keyframes — keep the existing background blobs as they are.

### Hero
- Rotating word: user-provided implementation, untouched (Framer Motion spring, y-axis swap, 2 s cycle).
- Page-load stagger: pill (delay 0) → headline (0.1 s) → subheading (0.2 s) → CTA row (0.3 s). Each: `opacity 0→1, y 12→0, duration 0.5, ease easeOut`. Implemented via parent `staggerChildren` variant.
- Buttons: `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.97 }}`. Arrow icons translate +4 px on hover via nested motion child.

### Top nav
- `useScroll()` watches the window. When `scrollY > 40`, animate `backgroundColor` and `backdropFilter` via `useTransform`.
- Logo letters use the same R-E-S-T entrance stagger from the existing authed header (now shared via `<RestMark />`).

### Feature header slab
- Each letter of `R-E-S-T` enters with `whileInView`, staggered 0.08 s, from `y: 30, opacity: 0, rotate: -8`.

### FlowSections (scroll-stack — GSAP)
- User-provided GSAP code is kept verbatim for pin-and-rotate behavior.
- Reduced-motion path: rotation disabled, sections render as a normal stacked column (already handled in the snippet).
- Inside each FlowSection, content uses Framer Motion `whileInView` with `{ once: true, margin: "-20% 0px" }`:
  - Section label pill: fade + slide up.
  - Headline: split into two lines, line 1 fades in, line 2 fades in 0.1 s later.
  - Body paragraph: fade up.
  - Mockup container: scale `0.96 → 1` plus fade.

### Mockups

Each mockup component:
- Uses `useInView` from Framer Motion to gate its loop. Loops pause when off-screen.
- Respects `useReducedMotionSafe()` — renders final state and skips loops if reduced motion is preferred.
- Wrapped in `React.memo`.
- Animates only `transform`, `opacity`, `backgroundPosition`, or `boxShadow` in loops (no layout-affecting properties).

**RevenueMockup** — 6-bar chart. Bars: `scaleY: 0 → final` with `transformOrigin: bottom`, staggered 0.08 s. The `$3,247/mo` counter uses `useMotionValue` + `animate()` to tween from 0 to target, formatted via subscriber. Loops every ~6 s with a fresh random target so it stays alive.

**EmailMockup** — phone frame (rounded div with notch). Email card slides in from `y: -30` with opacity, settles, then 0.8 s later a green check-circle scales `0 → 1` and a "Sent" pill fades in. Loops every ~5 s.

**ScheduleMockup** — 7-column week grid. Empty cells render first; appointment chips fade in with stagger (0.06 s each). After the stagger, one chip animates `x: 0 → +cellWidth` then back, simulating drag. Loops every ~7 s.

**TrackMockup** — three client cards stacked vertically, entering from `y: 20, opacity: 0` with stagger. Search field on top "types" filtered text via state-driven character animation. Cards reorder using `<AnimatePresence />` + `layout` prop for FLIP reorder. Loops every ~8 s.

### How It Works
- Cards: `whileInView` fade-up with stagger 0.12 s.
- `01 / 02 / 03` numerals: `useTransform` on scroll progress translates ~30 px on scroll past — gentle parallax.
- Hover: `scale 1.02, y: -4` with `transition: { type: "spring", stiffness: 300 }`.

### Pricing
- Cards fade up with stagger 0.1 s on view.
- "Pro" highlighted card has a persistent `boxShadow` pulse — Framer Motion `animate` between two shadow values, 3 s duration, `repeat: Infinity, repeatType: "mirror"`. Themed to `rgb(var(--color-primary))`.
- Hover: same `scale 1.02, y: -4` spring.

### Final CTA
- Block fades + scales (`opacity 0→1, scale 0.96→1`) when 60 % in view.
- Button has a continuous gradient sweep — child `motion.div` with `linear-gradient` background and `backgroundPosition` animating `0% → 200%` on a 4 s loop.

### Page-level
- Thin scroll progress bar fixed at top, `scaleX` driven by `useScroll` progress, primary color. Hidden on the authed app.
- Route transitions between `/`, `/login`, `/signup`: `AnimatePresence` wraps the routes, with a 0.2 s opacity + 8 px y exit/enter.

### Reduced-motion safety

`useReducedMotionSafe()` wraps Framer Motion's `useReducedMotion` and the `matchMedia('(prefers-reduced-motion: reduce)')` check the FlowArt code already does. All looping mockup animations and the gradient sweep on the CTA check it and skip looping (rendering their final state).

## Build order

1. **Install deps + router shell.** `App.tsx` becomes a route component under `/app/*`. `<AuthGuard>` redirects unauthed users from `/app/*` to `/login`. **Verify:** `/login` works as before, no regressions in authed app.
2. **Extract `<RestMark />`** from the existing `App.tsx` header. **Verify:** authed app header looks identical.
3. **Build `<Landing />` skeleton** with `<LandingNav />`, `<Hero />`, placeholder `<main>`. Hero gets rotating-word animation + themed buttons. **Verify:** hero renders, words rotate, CTAs route to `/signup`.
4. **Drop in `<FlowArt />` + `<FlowSection />`** with 4 placeholder sections containing only headlines (no mockups yet). **Verify:** scroll-stack pin-and-rotate works; reduced-motion path renders as plain stack.
5. **Build the 4 mockups** one by one (Revenue → Email → Schedule → Track), each in isolation. **Verify each:** loops while in view, respects reduced-motion, pauses off-screen.
6. **Wire mockups into FlowSections** with section copy and `whileInView` reveals.
7. **`HowItWorks` + `LandingPricing` + `FinalCTA` + `LandingFooter`.** Pricing pulls from `PLANS`. **Verify:** anchor links scroll to `#features`, `#how`, `#pricing`.
8. **Polish pass:** scroll progress bar, nav fade-on-scroll, route transitions via `AnimatePresence`.
9. **Manual flow test in dev:** cold load `/` → scroll → click `Get started free` → `/signup` → register → redirect to `/app` → reload `/` while signed in (landing remains public; no auto-redirect).

## Risks

- **GSAP ScrollTrigger + React 19 Strict Mode.** `useGSAP` from `@gsap/react` handles cleanup, but Strict Mode's double-invoke can stack triggers in dev. Mitigation: keep the GSAP context scoped to `containerRef` (already in the snippet); verify scrolling past + back doesn't accumulate.
- **Pin-spacing on the last FlowSection.** The last section in the user's snippet does not pin (intentional). Direct transition into `<HowItWorks>` can feel abrupt. Mitigation: ~10 vh of breathing room between FlowArt and HowItWorks; verify visually.
- **Mobile Safari + sticky transforms.** GSAP pinning + `transform: rotate()` with `transform-origin: bottom left` is finicky on iOS. Mitigation: test on iPhone-sized viewport. Fallback: disable rotation below `md` breakpoint and let sections stack normally; reveal animations alone still feel polished.
- **Bundle size.** GSAP + ScrollTrigger ≈ 50 KB gz; `react-router-dom` ≈ 10 KB gz. Acceptable for a marketing page; not lazy-loaded for now.
- **Existing `<LiquidAurora />` on `LoginScreen`.** Login is not being reskinned in this scope; the aurora stays.

## Acceptance criteria

- `/` renders the landing page: hero + 4 FlowSections + How It Works + Pricing + Final CTA + Footer.
- Hero rotating word cycles every 2 s.
- Scroll-stack pin-and-rotate works on desktop; falls back gracefully with `prefers-reduced-motion`.
- All 4 mockups loop while in viewport, pause when off-screen.
- Nav background fades in once scrolled past 40 px.
- Pricing cards pull from `PLANS` (single source of truth).
- `/login` and `/signup` still work; `/app/*` redirects to `/login` if unauthed.
- No regressions in the authed app's existing behavior.
