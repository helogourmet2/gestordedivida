-- Somente as funções no servidor podem consultar ou alterar acesso e pagamentos.
create table public.billing_accounts (
  user_id text primary key,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '3 months')
);
create table public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.billing_accounts(user_id),
  environment text not null check (environment in ('test', 'production')),
  mp_order_id text unique,
  status text not null default 'creating',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  mp_updated_at timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at timestamptz not null default now()
);
create unique index billing_one_pending_per_user on public.billing_payments(user_id, environment)
  where status in ('creating', 'pending', 'in_process');
create index billing_payments_user on public.billing_payments(user_id, environment, status);
alter table public.billing_accounts enable row level security;
alter table public.billing_payments enable row level security;
revoke all on public.billing_accounts, public.billing_payments from anon, authenticated;
grant all on public.billing_accounts, public.billing_payments to service_role;

create function public.billing_start_trial(p_user_id text)
returns setof public.billing_accounts language plpgsql security definer set search_path = public as $$
begin
  insert into billing_accounts(user_id) values(p_user_id) on conflict do nothing;
  return query select * from billing_accounts where user_id = p_user_id;
end;
$$;
create function public.billing_reserve_payment(p_user_id text, p_environment text)
returns setof public.billing_payments language plpgsql security definer set search_path = public as $$
begin
  -- Serializa cliques simultâneos e reutiliza a mesma cobrança/idempotency key.
  perform 1 from billing_accounts where user_id = p_user_id for update;
  update billing_payments set status = 'expired', updated_at = now()
    where user_id = p_user_id and environment = p_environment
    and status in ('creating','pending','in_process') and expires_at <= now();
  insert into billing_payments(user_id, environment) values(p_user_id, p_environment)
    on conflict (user_id, environment) where status in ('creating','pending','in_process') do nothing;
  return query select * from billing_payments where user_id = p_user_id
    and environment = p_environment and status in ('creating','pending','in_process');
end;
$$;
revoke all on function public.billing_start_trial(text) from public, anon, authenticated;
revoke all on function public.billing_reserve_payment(text,text) from public, anon, authenticated;
grant execute on function public.billing_start_trial(text) to service_role;
grant execute on function public.billing_reserve_payment(text,text) to service_role;

-- Evita que uma resposta antiga sobrescreva aprovação ou reembolso mais recente.
create function public.billing_record_order(p_attempt_id uuid, p_order_id text, p_status text, p_updated_at timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  update billing_payments set mp_order_id = p_order_id, status = p_status,
    mp_updated_at = p_updated_at, updated_at = now()
  where id = p_attempt_id and (mp_order_id is null or mp_order_id = p_order_id)
    and mp_updated_at <= p_updated_at
    and not (status in ('approved', 'refunded', 'charged_back') and p_status in ('pending','in_process','creating','unconfirmed'))
    and not (status in ('refunded','charged_back') and p_status = 'approved')
    and not (status = 'expired' and p_status in ('pending','in_process','creating','unconfirmed'));
end;
$$;
revoke all on function public.billing_record_order(uuid,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.billing_record_order(uuid,text,text,timestamptz) to service_role;
