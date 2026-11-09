# 🧪 Teste de Notificações Push - Checklist

## ✅ Pré-requisitos

- [x] Firebase projeto ativo: `gestor-dedividas`
- [x] Supabase projeto restaurado: `xdskhspqrqeraqnshuey`
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Edge Functions deployadas no Supabase
- [ ] HTTPS habilitado (localhost ou domínio em produção)

---

## 🔧 1. Verificar Configurações Firebase

### Console Firebase
1. Acesse: https://console.firebase.google.com/project/gestor-dedividas
2. Vá em **Project Settings → Cloud Messaging**
3. Verifique se a **Cloud Messaging API** está habilitada

### Obter VAPID Key
```bash
# No Firebase Console → Cloud Messaging → Web configuration
# Copie a "Web Push certificates" (VAPID Key pública)
```

### Verificar Service Account
1. Vá em **Project Settings → Service Accounts**
2. Clique em "Generate new private key"
3. Baixe o JSON (contém `private_key` necessária para o Supabase)

---

## 🔧 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# ─── Firebase ─────────────────────────────────────────────────────────────────
VITE_FIREBASE_API_KEY=AIzaSyAgqunr8bS1LlmRL0QMtqzQzqjPLqjAm5c
VITE_FIREBASE_AUTH_DOMAIN=gestor-dedividas.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gestor-dedividas
VITE_FIREBASE_STORAGE_BUCKET=gestor-dedividas.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=350301359382
VITE_FIREBASE_APP_ID=1:350301359382:web:fd5a495500b0e0ddf59437

# VAPID Key (obter no Firebase Console → Cloud Messaging)
VITE_FIREBASE_VAPID_KEY=SEU_VAPID_KEY_AQUI

# ─── Supabase ─────────────────────────────────────────────────────────────────
VITE_SUPABASE_URL=https://xdskhspqrqeraqnshuey.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY_AQUI
```

### Como obter o Supabase Anon Key:
1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/settings/api
2. Copie a `anon` `public` key

---

## 🔧 3. Deploy das Edge Functions

### Deploy Keep-Alive
```bash
supabase functions deploy keep-alive --project-ref xdskhspqrqeraqnshuey
```

### Deploy Send-Debt-Notifications
```bash
supabase functions deploy send-debt-notifications --project-ref xdskhspqrqeraqnshuey
```

### Configurar Secrets no Supabase
1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/functions
2. Clique em `send-debt-notifications` → **Secrets**
3. Adicione os secrets:

| Secret Name | Valor |
|------------|-------|
| `FCM_PROJECT_ID` | `gestor-dedividas` |
| `FCM_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@gestor-dedividas.iam.gserviceaccount.com` |
| `FCM_PRIVATE_KEY` | Conteúdo do campo `private_key` do JSON da Service Account (com `\n` literais) |

---

## 🔧 4. Executar Migrations no Supabase

1. Acesse o SQL Editor: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/sql
2. Execute a migration `001_initial_schema.sql`
3. Execute a migration `002_keep_alive_cron.sql`

### Verificar Jobs Agendados
```sql
-- Ver jobs do pg_cron
SELECT * FROM cron.job;

-- Ver histórico de execução
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

---

## 🧪 5. Testes Locais

### Instalar dependências
```bash
npm install
```

### Rodar em desenvolvimento
```bash
npm run dev
```

### Abrir no navegador
```
http://localhost:5173
```

### Testar permissão de notificações
1. Abra o DevTools (F12)
2. Vá em **Console**
3. O app deve solicitar permissão para notificações
4. Clique em "Permitir"
5. Verifique se o token FCM foi gerado (aparece no console)

### Verificar Service Worker
1. DevTools → **Application** → **Service Workers**
2. Deve aparecer `firebase-messaging-sw.js` como "activated"

---

## 🧪 6. Testar Push Manual

### Testar via Supabase
1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/functions
2. Clique em `send-debt-notifications` → **Invoke**
3. Cole o body:
```json
{
  "user_id": "vfk1471"
}
```
4. Clique em "Invoke function"

### Verificar Logs
- Logs da Edge Function aparecem no próprio Supabase
- Logs do Service Worker aparecem no DevTools → Console

---

## 🧪 7. Testar com Dívidas Reais

### Criar dívida vencendo hoje
1. Abra o app
2. Adicione uma dívida com vencimento **hoje**
3. Aguarde o job do pg_cron executar (às 08:00 BRT ou teste manualmente)

### Criar dívida vencendo amanhã
1. Adicione uma dívida com vencimento **amanhã**
2. Aguarde o job executar

---

## 🔍 8. Diagnóstico de Problemas

### Notificação não aparece
- [ ] Verificar permissão do navegador (Settings → Site settings → Notifications)
- [ ] Verificar se o Service Worker está ativo
- [ ] Verificar token FCM no localStorage: `fcm_token`
- [ ] Verificar token no Supabase: `SELECT * FROM fcm_tokens;`

### Edge Function com erro
- [ ] Verificar secrets configurados
- [ ] Verificar logs da função no Supabase
- [ ] Testar OAuth2: verificar se `FCM_PRIVATE_KEY` está correto

### Job do pg_cron não executa
- [ ] Verificar se a extensão pg_cron está habilitada: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- [ ] Verificar jobs: `SELECT * FROM cron.job;`
- [ ] Verificar execuções: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`

---

## 📊 9. Monitoramento

### Logs importantes
```bash
# Ver logs da Edge Function (no Supabase Dashboard)
# Functions → send-debt-notifications → Logs

# Ver logs do pg_cron
SELECT * FROM cron.job_run_details 
WHERE jobname = 'daily-debt-notifications' 
ORDER BY start_time DESC 
LIMIT 10;
```

### Health Check do Keep-Alive
```bash
# Testar se está funcionando
curl https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/keep-alive
```

---

## 📝 Checklist Final

- [ ] Firebase configurado e com Cloud Messaging habilitado
- [ ] Supabase restaurado e ativo
- [ ] Variáveis de ambiente no `.env`
- [ ] Edge Functions deployadas
- [ ] Secrets configurados no Supabase
- [ ] Migrations executadas
- [ ] Jobs do pg_cron agendados
- [ ] App local rodando e solicitando permissão
- [ ] Token FCM gerado e salvo no Supabase
- [ ] Service Worker ativo
- [ ] Teste manual de push bem-sucedido
- [ ] Keep-alive job ativo (a cada 5 minutos)

---

**Status**: 🟡 Em configuração
**Última atualização**: 2026-11-09
