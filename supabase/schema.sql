-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Accounts Table (Wallets, GCash, Credit, Pay Later)
create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  type text check (type in ('debit', 'credit', 'e-wallet', 'pay_later')),
  balance numeric default 0,
  template_identifier text, -- e.g., 'gcash', 'shopeepaylater', 'maya', 'cash'
  created_at timestamp with time zone default now()
);

-- 2. Create Categories Table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  type text check (type in ('income', 'expense')),
  icon text default 'tag',
  is_custom boolean default false
);

-- 3. Create Transactions Table (The Core Ledger)
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  account_id uuid references accounts(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  amount numeric not null,
  type text check (type in ('income', 'expense', 'transfer')),
  transaction_date timestamp with time zone default now(),
  is_recurring boolean default false,
  notes text
);

-- 4. Create Commitments Table (Installments & Debts)
create table if not exists commitments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  type text check (type in ('debt', 'owed_to_me', 'installment')),
  total_amount numeric not null,
  remaining_balance numeric not null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 5. Enable Row Level Security (RLS)
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table commitments enable row level security;

-- 6. Create RLS Policies
create policy "Users can view own accounts" on accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts" on accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts" on accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts" on accounts for delete using (auth.uid() = user_id);

create policy "Users can view own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on categories for delete using (auth.uid() = user_id);

create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions for delete using (auth.uid() = user_id);

create policy "Users can view own commitments" on commitments for select using (auth.uid() = user_id);
create policy "Users can insert own commitments" on commitments for insert with check (auth.uid() = user_id);
create policy "Users can update own commitments" on commitments for update using (auth.uid() = user_id);
create policy "Users can delete own commitments" on commitments for delete using (auth.uid() = user_id);
