# 🔧 Troubleshooting - Gestor de Dívidas

## 🚨 Problemas Comuns e Soluções

---

## 1. Supabase Pausando por Inatividade

### Sintoma
- Edge Functions retornam erro 500
- Queries no banco demoram ou falham
- Dashboard mostra projeto "pausado"

### Causa
Projetos Supabase no plano gratuito pausam após 7 dias de inatividade.

### ✅ Solução
1. **Restaurar manualmente** (já feito):
   - Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey
   - Clique em "Restore" se estiver pausado

2. **Prevenir pausas futuras** (implementado):
   ```powershell
   # Deploy da função keep-alive
   .\scripts\deploy-supabase.ps1
   
   # Verificar se está funcionando
   curl https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/keep-alive
   ```

3. **Verificar job do pg_cron**:
   ```sql
   -- No SQL Editor do Supabase
   SELECT * FROM cron.job WHERE jobname = 'keep-alive-ping';
   
   -- Ver execuções recentes
   SELECT * FROM cron.job_run_details 
   WHERE jobname = 'keep-alive-ping' 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

---

## 2. Notificações Push Não Aparecem

### Sintoma
- App abre normalmente
- Permissão de notificações foi concedida
- Mas nenhuma notificação aparece

### Diagnóstico
Execute o checklist:

```powershell
# 1. Verificar status geral
.\scripts\check-status.ps1

# 2. Testar funções
.\scripts\test-notifications.ps1
```

### Possíveis Causas

#### 2.1. Permissão Negada
```javascript
// DevTools Console (F12)
Notification.permission
```

- **"granted"** ✅ OK
- **"denied"** ❌ Permissão negada
- **"default"** ⚠️ Ainda não pediu

**Solução**: Limpe as configurações do site:
1. Chrome: Settings → Privacy and Security → Site Settings → Notifications
2. Encontre `localhost:5173`
3. Remove e tente novamente

#### 2.2. Service Worker Inativo
```javascript
// DevTools → Application → Service Workers
// Deve mostrar: firebase-messaging-sw.js (activated)
```

**Solução**:
```javascript
// DevTools Console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => console.log(reg));
});

// Se não aparecer, force o registro:
navigator.serviceWorker.register('/firebase-messaging-sw.js');
```

#### 2.3. Token FCM Não Gerado
```javascript
// DevTools Console
localStorage.getItem('fcm_token')
```

**Solução**:
1. Verifique o `.env`:
   ```env
   VITE_FIREBASE_VAPID_KEY=sua_vapid_key_aqui
   ```

2. Verifique logs no Console:
   ```
   [FCM] Token obtido: xxx...
   ```

3. Se não aparecer, verifique se há erros no console

#### 2.4. Token Não Salvo no Supabase
```sql
-- Supabase SQL Editor
SELECT * FROM fcm_tokens ORDER BY updated_at DESC;
```

**Solução**:
1. Verifique se a tabela existe:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'fcm_tokens';
   ```

2. Se não existir, execute a migration:
   ```sql
   -- Copie e execute: supabase/migrations/001_initial_schema.sql
   ```

---

## 3. Edge Function com Erro

### Sintoma
Ao invocar `send-debt-notifications`, retorna erro 500

### Diagnóstico

#### 3.1. Ver Logs
1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/functions
2. Clique em `send-debt-notifications` → **Logs**
3. Procure por erros

#### 3.2. Erros Comuns

**Erro: "FCM_PRIVATE_KEY is not defined"**
- **Causa**: Secret não configurado
- **Solução**: Configure os secrets (veja seção 4)

**Erro: "OAuth2 error: invalid_grant"**
- **Causa**: Private key incorreta ou mal formatada
- **Solução**: 
  1. Gere nova private key no Firebase
  2. Certifique-se de copiar TODA a string, incluindo:
     ```
     -----BEGIN PRIVATE KEY-----
     ...conteúdo...
     -----END PRIVATE KEY-----
     ```
  3. Os `\n` devem estar LITERAIS (não como quebras de linha reais)

**Erro: "No tokens found"**
- **Causa**: Nenhum token FCM cadastrado
- **Solução**: Abra o app e permita notificações primeiro

**Erro: "No debts found"**
- **Causa**: Nenhuma dívida vencendo hoje/amanhã
- **Solução**: Isso não é um erro, apenas indica que não há dívidas para notificar

---

## 4. Configurar Secrets no Supabase

### Passos Detalhados

1. **Obter Private Key do Firebase**
   - Acesse: https://console.firebase.google.com/project/gestor-dedividas/settings/serviceaccounts/adminsdk
   - Clique em "Gerar nova chave privada"
   - Baixe o JSON
   - Abra o arquivo e copie o campo `private_key`

2. **Adicionar no Supabase**
   - Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/functions
   - Clique em `send-debt-notifications`
   - Vá em **Secrets**
   - Adicione cada secret:

   | Name | Value |
   |------|-------|
   | `FCM_PROJECT_ID` | `gestor-dedividas` |
   | `FCM_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@gestor-dedividas.iam.gserviceaccount.com` |
   | `FCM_PRIVATE_KEY` | Cole a private_key do JSON (mantenha os `\n` literais) |

3. **Testar**
   ```powershell
   .\scripts\test-notifications.ps1
   ```

---

## 5. pg_cron Não Está Executando

### Sintoma
- Jobs aparecem em `cron.job`
- Mas não executam no horário agendado
- `cron.job_run_details` está vazio

### Diagnóstico

#### 5.1. Verificar se a extensão está habilitada
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Se não aparecer nada:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### 5.2. Verificar jobs
```sql
SELECT jobid, jobname, schedule, active 
FROM cron.job;
```

- `active = true` ✅ OK
- `active = false` ❌ Job desabilitado

**Solução**:
```sql
-- Habilitar job
SELECT cron.alter_job(jobid, enabled := true) 
FROM cron.job 
WHERE jobname = 'daily-debt-notifications';
```

#### 5.3. Verificar horário
```sql
SELECT schedule FROM cron.job WHERE jobname = 'daily-debt-notifications';
```

Deve ser: `0 11 * * *` (11:00 UTC = 08:00 BRT)

Se quiser mudar o horário:
```sql
SELECT cron.alter_job(
  jobid,
  schedule := '0 12 * * *'  -- 12:00 UTC = 09:00 BRT
)
FROM cron.job 
WHERE jobname = 'daily-debt-notifications';
```

#### 5.4. Executar manualmente
```sql
-- Forçar execução imediata (para teste)
SELECT cron.schedule(
  'test-notification',
  '* * * * *',  -- todo minuto
  $$
    SELECT net.http_post(
      url := 'https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/send-debt-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('user_id', 'vfk1471')
    );
  $$
);

-- Aguarde 1 minuto e verifique:
SELECT * FROM cron.job_run_details 
WHERE jobname = 'test-notification' 
ORDER BY start_time DESC;

-- Remover job de teste:
SELECT cron.unschedule('test-notification');
```

---

## 6. Firebase Authentication Não Funciona

### Sintoma
- Botão "Entrar com Google" não funciona
- Popup não abre
- Erro no console

### Possíveis Causas

#### 6.1. Domínio não autorizado
**Solução**:
1. Acesse: https://console.firebase.google.com/project/gestor-dedividas/authentication/settings
2. Vá em **Authorized domains**
3. Adicione `localhost`
4. Se estiver em produção, adicione seu domínio

#### 6.2. Google OAuth não habilitado
**Solução**:
1. Acesse: https://console.firebase.google.com/project/gestor-dedividas/authentication/providers
2. Clique em "Google"
3. Habilite o provider
4. Configure o email de suporte

---

## 7. Build Falha

### Sintoma
```
npm run build
```
Retorna erros

### Soluções

#### 7.1. Limpar cache
```powershell
Remove-Item -Recurse -Force node_modules, dist, .vite
npm install
npm run build
```

#### 7.2. Verificar variáveis de ambiente
O build precisa do `.env` configurado. Se faltar alguma variável:
```
Missing environment variable: VITE_FIREBASE_API_KEY
```

**Solução**: Configure o `.env` completo

---

## 8. Deploy Firebase Hosting Falha

### Sintoma
```
firebase deploy --only hosting
```
Retorna erro de permissão ou projeto não encontrado

### Soluções

#### 8.1. Fazer login novamente
```powershell
firebase logout
firebase login
```

#### 8.2. Verificar projeto
```powershell
firebase projects:list
```

Se `gestor-dedividas` não aparecer, você não tem acesso.

**Solução**: Entre com a conta `helogourmet2@gmail.com`

#### 8.3. Build antes de deploy
```powershell
npm run build
firebase deploy --only hosting
```

---

## 9. Queries Úteis para Debugging

### Ver todos os tokens FCM
```sql
SELECT 
  user_id, 
  LEFT(token, 30) as token_preview,
  updated_at 
FROM fcm_tokens 
ORDER BY updated_at DESC;
```

### Ver dívidas vencendo
```sql
-- Hoje
SELECT * FROM debts 
WHERE due_date = CURRENT_DATE 
  AND is_paid = false;

-- Amanhã
SELECT * FROM debts 
WHERE due_date = CURRENT_DATE + INTERVAL '1 day'
  AND is_paid = false;
```

### Ver status dos jobs
```sql
SELECT 
  j.jobname,
  j.schedule,
  j.active,
  COUNT(jr.jobid) as total_runs,
  MAX(jr.start_time) as last_run
FROM cron.job j
LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
GROUP BY j.jobname, j.schedule, j.active
ORDER BY j.jobname;
```

### Ver histórico de execução dos jobs
```sql
SELECT 
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

---

## 10. Resetar Completamente o Sistema

Se nada funcionar, tente resetar:

### 10.1. Frontend
```powershell
# Limpar tudo
Remove-Item -Recurse -Force node_modules, dist, .vite
Remove-Item .env -Force

# Reconfigurar
cp .env.example .env
# Edite o .env com as credenciais corretas
npm install
npm run dev
```

### 10.2. Supabase
```sql
-- Remover dados de teste
TRUNCATE TABLE fcm_tokens CASCADE;

-- Remover jobs antigos
SELECT cron.unschedule('daily-debt-notifications');
SELECT cron.unschedule('keep-alive-ping');

-- Recriar jobs (execute as migrations novamente)
-- 001_initial_schema.sql
-- 002_keep_alive_cron.sql
```

### 10.3. Firebase
1. Acesse o console Firebase
2. Vá em Cloud Messaging
3. Verifique se a VAPID Key está ativa
4. Gere uma nova Service Account key se necessário

---

## 📞 Contatos e Links

### Contas
- **Email**: helogourmet2@gmail.com

### Links Importantes
- **Firebase Console**: https://console.firebase.google.com/project/gestor-dedividas
- **Supabase Dashboard**: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey
- **GitHub Repo**: https://github.com/helogourmet2/gestordedivida

---

**Última atualização**: 2026-11-09
