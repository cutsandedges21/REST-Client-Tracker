# Database setup / migration (run this first)

The app talks to Supabase project **`apkysupvpahnkibjfrin`** (from `.env` →
`VITE_SUPABASE_URL`). This release adds new columns and a table, so you must run
the updated schema once before the new features work.

`supabase/schema.sql` is **idempotent** — safe to run as many times as you like.
It only adds what's missing and migrates old data in place.

## What this migration does

- Adds `clients.expense_type` (`'fixed' | 'percent'`) — for the $ / % expense toggle.
- Replaces the `service_frequency` options:
  - **removes** `three_weeks` (existing rows are converted to `monthly`),
  - **adds** `one_time`, `six_weeks`, `two_months`.
- Adds the `expenses` table (business expenses: gas, blades, supplies) with RLS.
- Adds `profiles.invoice_template`, `profiles.business_name`, `profiles.stripe_customer_id`.
- Adds `completed_jobs.paid` (boolean) + `completed_jobs.payment_method`
  (`cash | etransfer | card | other`) — payment tracking for the Route tab.
- Adds the `route_stops` table (ordered daily route: client + date + sort order,
  linked to a completed job once logged) with RLS.

> **Required for the Route tab.** Logging visits and building routes writes the
> new columns/table above — run this migration before using the Route page, or
> those writes will fail.

## How to run it (2 minutes, no CLI needed)

1. Go to <https://supabase.com/dashboard> and open the project
   **`apkysupvpahnkibjfrin`**.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` in this repo, copy the **entire** file, paste it in.
4. Click **Run**. You should see `Success. No rows returned`.

That's it. Reload the app.

## Verify (optional)

In the SQL editor:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'clients' and column_name = 'expense_type';
-- expect 1 row

select * from information_schema.tables
where table_schema = 'public' and table_name = 'expenses';
-- expect 1 row

select distinct service_frequency from public.clients;
-- should never contain 'three_weeks'
```

## Notes

- RLS is enabled on every table; each user only ever sees their own rows.
- No data is deleted by this migration. `three_weeks` clients become `monthly`
  (identical monthly multiplier, so revenue projections don't change).
