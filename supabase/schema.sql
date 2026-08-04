-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table (User settings & streak preferences)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  streak_count_criteria text default 'either' check (streak_count_criteria in ('either', 'income', 'expense')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create Accounts Table (Wallets, GCash, Credit, Pay Later)
create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text check (type in ('debit', 'credit', 'e-wallet', 'pay_later')),
  balance numeric default 0,
  template_identifier text, -- e.g., 'gcash', 'shopeepaylater', 'maya', 'debit', 'cash'
  category_group text,
  color text,
  subtext text,
  annual_interest_rate numeric default 0,
  interest_frequency text default 'daily',
  withholding_tax numeric default 20,
  maintaining_balance numeric default 0,
  last_interest_date text,
  last_daily_interest_earned numeric default 0,
  created_at timestamp with time zone default now()
);

-- 3. Create Categories Table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')),
  icon text default 'tag',
  color text default '#10B981',
  is_custom boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. Create Transactions Table (The Core Ledger)
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  category_name text,
  amount numeric not null,
  type text check (type in ('income', 'expense', 'transfer')),
  transaction_date timestamp with time zone default now(),
  is_recurring boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

-- 5. Create Commitments Table (Installments & Debts)
create table if not exists commitments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  type text check (type in ('debt', 'owed_to_me', 'installment')),
  total_amount numeric not null,
  remaining_balance numeric not null,
  due_date timestamp with time zone,
  vendor text,
  status text default 'In Progress',
  created_at timestamp with time zone default now()
);

-- 6. Create Goals Table (Personal Savings Goals)
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  target_date timestamp with time zone,
  category text default 'Savings',
  created_at timestamp with time zone default now()
);

-- 7. Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table commitments enable row level security;
alter table goals enable row level security;

-- 8. Create RLS Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

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

create policy "Users can view own goals" on goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on goals for delete using (auth.uid() = user_id);
