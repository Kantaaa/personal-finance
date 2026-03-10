-- ============================================================================
-- Personal Finance — initial schema
-- ============================================================================

-- Accounts (bank/card sources)
create table accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,                         -- e.g. "Sparebanken Norge Main"
  type        text not null default 'bank',          -- bank | card | other
  provider    text not null,                         -- sparebanken | curve | trumf
  created_at  timestamptz not null default now()
);

alter table accounts enable row level security;

create policy "Users can manage their own accounts"
  on accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_accounts_user on accounts(user_id);

-- Transactions
create table transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  account_id  uuid references accounts(id) on delete set null,
  date        date not null,
  amount      numeric(12,2) not null,                -- positive = income, negative = expense
  currency    text not null default 'NOK',
  description text,
  merchant    text,
  category    text not null default 'Other',
  source_raw  text,                                  -- original filename / source identifier
  notes       text,
  created_at  timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Users can manage their own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_transactions_user      on transactions(user_id);
create index idx_transactions_date      on transactions(user_id, date);
create index idx_transactions_category  on transactions(user_id, category);
