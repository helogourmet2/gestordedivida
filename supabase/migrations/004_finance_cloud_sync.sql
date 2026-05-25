-- Sincronizacao de categorias e transacoes por usuario
-- Tambem adiciona category_sync_id em debts para resolver referencias entre dispositivos

alter table public.debts
  add column if not exists category_sync_id text;

create table if not exists public.debt_categories (
  id          uuid primary key default gen_random_uuid(),
  local_id    bigint,
  sync_id     text not null,
  user_id     text not null,
  name        text not null,
  color       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists debt_categories_user_sync_idx
  on public.debt_categories (user_id, sync_id);

create table if not exists public.transaction_categories (
  id          uuid primary key default gen_random_uuid(),
  local_id    bigint,
  sync_id     text not null,
  user_id     text not null,
  name        text not null,
  type        text not null,
  color       text,
  icon        text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists transaction_categories_user_sync_idx
  on public.transaction_categories (user_id, sync_id);

create table if not exists public.transactions (
  id                uuid primary key default gen_random_uuid(),
  local_id          bigint,
  sync_id           text not null,
  user_id           text not null,
  type              text not null,
  amount            numeric(12,2) not null,
  transaction_date  date not null,
  category_sync_id  text,
  description       text,
  is_paid           boolean not null default false,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists transactions_user_sync_idx
  on public.transactions (user_id, sync_id);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date);

alter table public.debt_categories enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;

create policy "Usuario gerencia suas categorias de divida"
  on public.debt_categories for all
  using (true)
  with check (true);

create policy "Usuario gerencia suas categorias de transacao"
  on public.transaction_categories for all
  using (true)
  with check (true);

create policy "Usuario gerencia suas transacoes"
  on public.transactions for all
  using (true)
  with check (true);
