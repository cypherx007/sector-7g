-- Archive support for reviews.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- Adds an `archived` flag so a submitted review can be moved into the
-- dashboard's Archive tab ("Sealed Reviews") and restored again, without
-- deleting it. Existing rows default to not archived.

alter table public.reviews
  add column if not exists archived boolean not null default false;

-- Faster split between active and sealed reviews on the dashboard.
create index if not exists reviews_user_archived_idx
  on public.reviews (user_id, archived);

-- RLS: the dashboard updates `archived` via the publishable key, so users
-- need an UPDATE policy scoped to their own rows. (SELECT / INSERT / DELETE
-- policies are expected to exist already; add them too if they don't.)
alter table public.reviews enable row level security;

drop policy if exists "own reviews - update" on public.reviews;
create policy "own reviews - update"
  on public.reviews
  for update
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
