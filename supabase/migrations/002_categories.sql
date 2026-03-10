-- ============================================================================
-- Categories — per-user category management
-- ============================================================================

create table categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique(user_id, name)
);

alter table categories enable row level security;

create policy "Users can manage their own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_categories_user on categories(user_id);

-- Seed default categories for a new user
create or replace function seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into categories (user_id, name, sort_order)
  values
    (p_user_id, 'Housing',       1),
    (p_user_id, 'Groceries',     2),
    (p_user_id, 'Eating out',    3),
    (p_user_id, 'Transport',     4),
    (p_user_id, 'Subscriptions', 5),
    (p_user_id, 'Health',        6),
    (p_user_id, 'Shopping',      7),
    (p_user_id, 'Income',        8),
    (p_user_id, 'Insurance',     9),
    (p_user_id, 'Savings',      10),
    (p_user_id, 'Other',        11)
  on conflict (user_id, name) do nothing;
end;
$$;
