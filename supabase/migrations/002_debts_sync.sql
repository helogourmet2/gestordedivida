-- ─── Tabela de dívidas sincronizadas ─────────────────────────────────────────
-- Espelha as dívidas do IndexedDB para permitir push com app fechado
-- O campo local_id é o id do IndexedDB (para upsert sem duplicar)

create table if not exists public.debts (
  id            uuid primary key default gen_random_uuid(),
  local_id      integer not null,
  user_id       text not null,
  name          text not null,
  amount        numeric(12,2) not null,
  due_date      date not null,
  is_paid       boolean not null default false,
  paid_at       timestamptz,
  recurrence    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índice único: um local_id por usuário (permite upsert)
create unique index if not exists debts_user_local_idx
  on public.debts (user_id, local_id);

-- Índice para busca por vencimento
create index if not exists debts_due_date_idx
  on public.debts (due_date, is_paid);

-- RLS
alter table public.debts enable row level security;

create policy "Usuário gerencia suas próprias dívidas"
  on public.debts for all
  using (true)
  with check (true);

-- ─── Atualizar pg_cron para usar user_id do Firebase Auth ────────────────────
-- Remove o job antigo hardcoded e recria usando a tabela fcm_tokens
-- (o job agora itera sobre todos os usuários com token registrado)

select cron.unschedule('daily-debt-notifications');

select cron.schedule(
  'daily-debt-notifications',
  '0 11 * * *',   -- 08:00 BRT (UTC-3)
  $$
    select net.http_post(
      url     := 'https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/send-debt-notifications',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);
