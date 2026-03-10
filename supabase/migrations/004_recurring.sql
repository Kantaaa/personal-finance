-- Recurring transaction tracking
create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description_pattern text not null,
  category text not null,
  expected_amount numeric(12,2) not null,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_expected_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table recurring_transactions enable row level security;

create policy "Users can manage their own recurring transactions"
  on recurring_transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_recurring_user on recurring_transactions(user_id);
create index idx_recurring_active on recurring_transactions(user_id, active) where active = true;
