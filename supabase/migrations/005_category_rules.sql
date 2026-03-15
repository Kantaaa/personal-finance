-- ============================================================================
-- Category Rules — keyword-based auto-categorization
-- ============================================================================

create table category_rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  keyword     text not null,              -- lowercase match pattern e.g. "rema", "kiwi"
  category    text not null,              -- target category name
  priority    int not null default 0,     -- higher = checked first
  created_at  timestamptz not null default now(),
  unique(user_id, keyword)
);

alter table category_rules enable row level security;

create policy "Users can manage their own category rules"
  on category_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_category_rules_user on category_rules(user_id);

-- Seed default Norwegian category rules for a new user
create or replace function seed_default_category_rules(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into category_rules (user_id, keyword, category, priority)
  values
    -- Groceries
    (p_user_id, 'rema', 'Groceries', 10),
    (p_user_id, 'kiwi', 'Groceries', 10),
    (p_user_id, 'meny', 'Groceries', 10),
    (p_user_id, 'coop', 'Groceries', 10),
    (p_user_id, 'bunnpris', 'Groceries', 10),
    -- Transport
    (p_user_id, 'vy', 'Transport', 10),
    (p_user_id, 'ruter', 'Transport', 10),
    (p_user_id, 'sas', 'Transport', 10),
    (p_user_id, 'widerøe', 'Transport', 10),
    -- Eating out
    (p_user_id, 'peppes', 'Eating out', 10),
    (p_user_id, 'foodora', 'Eating out', 10),
    (p_user_id, 'wolt', 'Eating out', 10),
    -- Subscriptions
    (p_user_id, 'netflix', 'Subscriptions', 10),
    (p_user_id, 'spotify', 'Subscriptions', 10),
    (p_user_id, 'hbo', 'Subscriptions', 10),
    (p_user_id, 'disney', 'Subscriptions', 10),
    -- Health
    (p_user_id, 'dyreklinikk', 'Health', 10),
    (p_user_id, 'apotek', 'Health', 10),
    (p_user_id, 'tannlege', 'Health', 10),
    -- Insurance
    (p_user_id, 'frende', 'Insurance', 10),
    (p_user_id, 'if ', 'Insurance', 10),
    (p_user_id, 'gjensidige', 'Insurance', 10),
    -- Savings
    (p_user_id, 'sparing', 'Savings', 10),
    -- Income
    (p_user_id, 'lønn', 'Income', 10),
    (p_user_id, 'innbetaling', 'Income', 5)
  on conflict (user_id, keyword) do nothing;
end;
$$;
