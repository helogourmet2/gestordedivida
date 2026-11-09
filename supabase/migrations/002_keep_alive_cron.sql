-- ─── Job para manter o Supabase ativo ───────────────────────────────────────
-- Faz ping na Edge Function keep-alive a cada 5 minutos
-- Isso evita que o projeto pause por inatividade no plano gratuito

-- Agendar job a cada 5 minutos
select cron.schedule(
  'keep-alive-ping',        -- nome do job
  '*/5 * * * *',            -- cron: a cada 5 minutos
  $$
    select net.http_get(
      url := 'https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/keep-alive'
    );
  $$
);

-- Para verificar os jobs agendados:
-- select * from cron.job;

-- Para remover o job (se necessário):
-- select cron.unschedule('keep-alive-ping');

-- Para verificar o histórico de execução:
-- select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'keep-alive-ping') order by start_time desc limit 10;
