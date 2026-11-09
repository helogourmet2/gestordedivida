# 📋 Resumo Executivo - Contas e Próximos Passos

## ✅ Status Atual

### Contas Identificadas
- **Firebase**: helogourmet2@gmail.com (Projeto: `gestor-dedividas`)
- **Supabase**: helogourmet2@gmail.com (Projeto: `xdskhspqrqeraqnshuey`)
- **GitHub**: helogourmet2@gmail.com (Repositório vinculado ao Supabase)

### Problema Resolvido
✅ Supabase estava **pausado por inatividade** - foi restaurado em 2026-11-09

### Solução Implementada
✅ Criada função **`keep-alive`** que roda a cada 5 minutos via pg_cron para manter o projeto ativo

---

## 🎯 Próximos Passos (em ordem)

### 1. Obter Credenciais Faltantes

#### Firebase VAPID Key
```bash
# 1. Acesse: https://console.firebase.google.com/project/gestor-dedividas/settings/cloudmessaging
# 2. Vá em "Configuração da Web" → "Certificados push da Web"
# 3. Copie a chave pública (VAPID Key)
# 4. Cole no .env como VITE_FIREBASE_VAPID_KEY
```

#### Supabase Anon Key
```bash
# 1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/settings/api
# 2. Copie a "anon public" key
# 3. Cole no .env como VITE_SUPABASE_ANON_KEY
```

#### Firebase Private Key (para Supabase)
```bash
# 1. Acesse: https://console.firebase.google.com/project/gestor-dedividas/settings/serviceaccounts/adminsdk
# 2. Clique em "Gerar nova chave privada"
# 3. Baixe o arquivo JSON
# 4. Copie o campo "private_key"
# 5. Adicione como secret no Supabase (veja passo 3)
```

---

### 2. Criar arquivo .env

Copie o `.env.example` e preencha:

```bash
cp .env.example .env
```

Edite o `.env` com as credenciais obtidas no passo 1.

---

### 3. Deploy das Edge Functions no Supabase

```powershell
# Execute o script automatizado
.\scripts\deploy-supabase.ps1
```

Depois, configure os **secrets** no Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/functions
2. Clique em `send-debt-notifications` → **Secrets**
3. Adicione:
   - `FCM_PROJECT_ID` = `gestor-dedividas`
   - `FCM_CLIENT_EMAIL` = `firebase-adminsdk-fbsvc@gestor-dedividas.iam.gserviceaccount.com`
   - `FCM_PRIVATE_KEY` = (conteúdo da private key do JSON)

---

### 4. Executar Migrations SQL

1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/sql
2. Execute `supabase/migrations/001_initial_schema.sql`
3. Execute `supabase/migrations/002_keep_alive_cron.sql`

---

### 5. Instalar Dependências e Rodar Local

```bash
npm install
npm run dev
```

---

### 6. Testar Notificações Push

```powershell
# Execute o script de teste
.\scripts\test-notifications.ps1
```

Ou siga o guia completo: **[test-push-notifications.md](./test-push-notifications.md)**

---

## 📊 Arquivos Criados

### Documentação
- ✅ **CONTAS_E_SERVICOS.md** - Documentação completa de todas as contas
- ✅ **test-push-notifications.md** - Guia de testes de notificações
- ✅ **RESUMO_CONTAS.md** - Este arquivo (resumo executivo)

### Código
- ✅ **supabase/functions/keep-alive/index.ts** - Função para manter Supabase ativo
- ✅ **supabase/migrations/002_keep_alive_cron.sql** - Job do pg_cron para keep-alive

### Scripts
- ✅ **scripts/deploy-supabase.ps1** - Script automatizado de deploy
- ✅ **scripts/test-notifications.ps1** - Script de testes

---

## 🔍 Verificações Importantes

### Verificar se Keep-Alive está funcionando
```powershell
# Testar endpoint
curl https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/keep-alive

# Verificar job no Supabase SQL Editor
SELECT * FROM cron.job WHERE jobname = 'keep-alive-ping';

# Ver histórico de execução
SELECT * FROM cron.job_run_details 
WHERE jobname = 'keep-alive-ping' 
ORDER BY start_time DESC 
LIMIT 10;
```

### Verificar Notificações
1. Abra o app local (http://localhost:5173)
2. Permita notificações quando solicitado
3. Verifique no console se o token FCM foi gerado
4. Verifique se o token foi salvo no Supabase:
```sql
SELECT * FROM fcm_tokens;
```

---

## 🚨 Problemas Conhecidos e Soluções

### Supabase pausando por inatividade
✅ **Resolvido**: Keep-alive job executando a cada 5 minutos

### Notificações não aparecem
- Verificar permissão do navegador
- Verificar Service Worker ativo
- Verificar token FCM no localStorage
- Verificar secrets do Supabase configurados

### Edge Function com erro
- Verificar logs no Supabase Dashboard
- Verificar se os secrets estão corretos
- Verificar formato da private_key (deve incluir `\n` literais)

---

## 📞 Links Úteis

### Firebase
- **Console**: https://console.firebase.google.com/project/gestor-dedividas
- **Cloud Messaging**: https://console.firebase.google.com/project/gestor-dedividas/settings/cloudmessaging
- **Service Accounts**: https://console.firebase.google.com/project/gestor-dedividas/settings/serviceaccounts/adminsdk

### Supabase
- **Dashboard**: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey
- **Functions**: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/functions
- **SQL Editor**: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/sql
- **API Settings**: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/settings/api

---

**Status Geral**: 🟡 Configuração pendente  
**Última atualização**: 2026-11-09  
**Responsável**: helogourmet2@gmail.com
