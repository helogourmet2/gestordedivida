-- ─── Tabela de tokens FCM ────────────────────────────────────────────────────
-- Armazena o token FCM do dispositivo para envio de push com app fechado

create table if not exists public.fcm_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  token       text not null unique,
  updated_at  timestamptz not null default now()
);

-- Índice para busca por user_id
create index if not exists fcm_tokens_user_id_idx on public.fcm_tokens (user_id);

-- RLS: apenas o próprio usuário pode ler/escrever seu token
alter table public.fcm_tokens enable row level security;

create policy "Acesso público para inserção de token"
  on public.fcm_tokens for insert
  with check (true);

create policy "Acesso público para atualização de token"
  on public.fcm_tokens for update
  using (true);

-- ─── Ativar extensões necessárias ────────────────────────────────────────────
-- Execute no SQL Editor do Supabase (requer permissão de superuser)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─── Job diário de notificações (pg_cron) ────────────────────────────────────
-- Dispara todos os dias às 08:00 (horário UTC-3 = 11:00 UTC)
-- Ajuste o horário conforme seu fuso horário

select cron.schedule(
  'daily-debt-notifications',   -- nome do job
  '0 11 * * *',                 -- cron: 11:00 UTC = 08:00 BRT
  $$
    select net.http_post(
      url     := 'https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/send-debt-notifications',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body    := jsonb_build_object('user_id', 'vfk1471')
    );
  $$
);

-- Para verificar os jobs agendados:
-- select * from cron.job;

-- Para remover o job:
-- select cron.unschedule('daily-debt-notifications');

-- ─── Secrets necessários na Edge Function (Supabase Dashboard) ───────────────
-- Vá em: Supabase → Edge Functions → send-debt-notifications → Secrets
-- Adicione os seguintes secrets:
--
-- FCM_PROJECT_ID     = gestor-dedividas
-- FCM_CLIENT_EMAIL   = firebase-adminsdk-fbsvc@gestor-dedividas.iam.gserviceaccount.com
-- FCM_PRIVATE_KEY    = (cole a private_key do arquivo JSON da Service Account, com \n literais)
