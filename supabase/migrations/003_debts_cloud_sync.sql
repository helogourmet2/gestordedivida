-- Suporte a sincronizacao bidirecional de dividas por usuario
-- Mantem um identificador estavel por divida para uso entre dispositivos

alter table public.debts
  add column if not exists sync_id text,
  add column if not exists category_id bigint,
  add column if not exists installments integer,
  add column if not exists current_installment integer,
  add column if not exists parent_id text;

update public.debts
set sync_id = coalesce(sync_id, gen_random_uuid()::text)
where sync_id is null;

alter table public.debts
  alter column sync_id set not null;

create unique index if not exists debts_user_sync_idx
  on public.debts (user_id, sync_id);

create index if not exists debts_user_due_date_idx
  on public.debts (user_id, due_date);
