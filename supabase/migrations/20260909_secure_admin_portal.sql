create type public.app_role as enum ('trader', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.app_role not null default 'trader',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  usdt_balance numeric not null default 0 check (usdt_balance >= 0),
  assets jsonb not null default '{}'::jsonb check (jsonb_typeof(assets) = 'object'),
  network text not null default 'Arbitrum One',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_accounts (
  id text primary key,
  full_name text not null,
  email text not null,
  wallet_address text not null default '',
  country text not null default '',
  tier text not null check (tier in ('Tier 1 (Basic)', 'Tier 2 (Pro)', 'Tier 3 (Institutional)')),
  kyc_status text not null check (kyc_status in ('verified', 'pending_review', 'rejected')),
  submitted_date date not null default current_date,
  trading_volume_usd numeric not null default 0 check (trading_volume_usd >= 0),
  usdt_balance numeric not null default 0 check (usdt_balance >= 0),
  assets jsonb not null default '{}'::jsonb check (jsonb_typeof(assets) = 'object'),
  account_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  status text not null check (status in ('success', 'failed', 'warning')),
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create function public.create_profile_and_wallet_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.wallets (user_id, usdt_balance, assets)
  values (new.id, 0, '{}'::jsonb);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.create_profile_and_wallet_for_new_user();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.client_accounts enable row level security;
alter table public.security_audit_logs enable row level security;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "Admins can manage profiles"
on public.profiles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users can read their own wallet"
on public.wallets for select to authenticated
using (user_id = auth.uid());

create policy "Admins can manage wallets"
on public.wallets for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage client accounts"
on public.client_accounts for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read audit logs"
on public.security_audit_logs for select to authenticated
using (public.is_admin());

create policy "Authenticated users can add audit logs"
on public.security_audit_logs for insert to authenticated
with check (actor_id = auth.uid());
