-- ============================================================================
-- Budgets — per-user monthly budget targets by category
-- ============================================================================

create table budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  amount      numeric(12,2) not null,  -- monthly budget limit (positive number)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, category)
);

alter table budgets enable row level security;

create policy "Users can manage their own budgets"
  on budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_budgets_user on budgets(user_id);
