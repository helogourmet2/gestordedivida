# 📋 Contas e Serviços do Backend - Gestor de Dívidas

> **📚 Documentação Completa do Projeto**
> - [RESUMO_CONTAS.md](./RESUMO_CONTAS.md) - Resumo executivo e próximos passos
> - [test-push-notifications.md](./test-push-notifications.md) - Guia completo de testes
> - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Solução de problemas comuns
> - Scripts: [check-status.ps1](./scripts/check-status.ps1), [deploy-supabase.ps1](./scripts/deploy-supabase.ps1), [test-notifications.ps1](./scripts/test-notifications.ps1)

## 🔥 Firebase

### **Projeto**: `gestor-dedividas`
- **Console**: https://console.firebase.google.com/project/gestor-dedividas
- **Conta Google**: helogourmet2@gmail.com ✅

### Configuração Atual (detectada no código)
```json
{
  "apiKey": "AIzaSyAgqunr8bS1LlmRL0QMtqzQzqjPLqjAm5c",
  "authDomain": "gestor-dedividas.firebaseapp.com",
  "projectId": "gestor-dedividas",
  "storageBucket": "gestor-dedividas.firebasestorage.app",
  "messagingSenderId": "350301359382",
  "appId": "1:350301359382:web:fd5a495500b0e0ddf59437"
}
```

### Serviços Utilizados
- ✅ **Firebase Hosting** - Hospedagem do PWA
- ✅ **Cloud Messaging (FCM)** - Push notifications
- ✅ **Authentication** - Login com Google

### Informações Importantes
- **Service Account**: `firebase-adminsdk-fbsvc@gestor-dedividas.iam.gserviceaccount.com`
- **VAPID Key**: Configurada via variável de ambiente `VITE_FIREBASE_VAPID_KEY`
- **Chave do Servidor FCM**: Usada na Edge Function do Supabase

### URLs
- **App Hospedado**: https://gestor-dedividas.web.app (ou firebaseapp.com)
- **Cloud Messaging Config**: Firebase Console → Cloud Messaging → Configuração da Web

---

## 🗄️ Supabase

### **Projeto**: `xdskhspqrqeraqnshuey`
- **Console**: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey
- **API URL**: `https://xdskhspqrqeraqnshuey.supabase.co`
- **Conta GitHub**: helogourmet2@gmail.com ✅
- **Status**: Projeto estava pausado, foi restaurado em 2026-11-09

### Serviços Utilizados
- ✅ **Database** (PostgreSQL) - Armazenamento de tokens FCM e dívidas
- ✅ **Edge Functions** - Função serverless para envio de notificações
- ✅ **pg_cron** - Agendamento de notificações diárias
- ✅ **Row Level Security (RLS)** - Controle de acesso aos dados

### Tabelas
1. **`fcm_tokens`**
   - Armazena tokens FCM dos dispositivos
   - Campos: `id`, `user_id`, `token`, `updated_at`
   - RLS: Acesso público para insert/update

2. **`debts`** (referenciada no código, precisa verificar schema)
   - Armazena as dívidas dos usuários
   - Campos: `user_id`, `name`, `amount`, `due_date`, `is_paid`

### Edge Functions Deployadas
1. **`send-debt-notifications`**
   - **URL**: `https://xdskhspqrqeraqnshuey.supabase.co/functions/v1/send-debt-notifications`
   - **Função**: Envia notificações push de dívidas vencendo hoje ou amanhã
   - **Trigger**: pg_cron job diário às 11:00 UTC (08:00 BRT)
   - **Autenticação**: OAuth2 via Service Account do Firebase

### Secrets Configurados na Edge Function
```
FCM_PROJECT_ID     = gestor-dedividas
FCM_CLIENT_EMAIL   = firebase-adminsdk-fbsvc@gestor-dedividas.iam.gserviceaccount.com
FCM_PRIVATE_KEY    = (private key da Service Account do Firebase)
```

### pg_cron Job
- **Nome**: `daily-debt-notifications`
- **Schedule**: `0 11 * * *` (todos os dias às 11:00 UTC = 08:00 BRT)
- **User ID configurado**: `vfk1471` (hardcoded no SQL)

### Variáveis de Ambiente Necessárias
```env
VITE_SUPABASE_URL=https://xdskhspqrqeraqnshuey.supabase.co
VITE_SUPABASE_ANON_KEY=(precisa ser obtida no Supabase Dashboard)
```

---

## 🔐 Credenciais e Acessos Necessários

### Para Acessar Firebase
1. Fazer login em https://console.firebase.google.com
2. Projeto: `gestor-dedividas`
3. Verificar se tem acesso com a conta do Google que criou o projeto

### Para Acessar Supabase
1. Fazer login em https://supabase.com
2. Projeto: `xdskhspqrqeraqnshuey`
3. Verificar se tem acesso com a conta que criou o projeto

---

## 📝 Próximos Passos de Investigação

### ❓ Informações que precisam ser verificadas:

1. **Firebase**
   - [ ] Verificar qual conta Google está conectada ao projeto
   - [ ] Obter a VAPID Key pública atual
   - [ ] Verificar se o Firebase Hosting está no plano Spark (gratuito)
   - [ ] Confirmar se há outras contas/projetos relacionados

2. **Supabase**
   - [ ] Verificar qual conta/email está conectada ao projeto
   - [ ] Obter a `anon key` atual (Settings → API)
   - [ ] Verificar se o projeto está no plano gratuito
   - [ ] Verificar se o schema da tabela `debts` está completo
   - [ ] Confirmar se há outros projetos relacionados

3. **Geral**
   - [ ] Verificar se existem outras contas/serviços de terceiros
   - [ ] Documentar domínios customizados (se houver)
   - [ ] Verificar se há backups configurados

---

## 🚀 Comandos para Deploy

### Firebase Hosting
```bash
# Login
firebase login

# Build e deploy
npm run build
firebase deploy --only hosting
```

### Supabase Edge Function
```bash
# Login
supabase login

# Deploy da função
supabase functions deploy send-debt-notifications --project-ref xdskhspqrqeraqnshuey
```

---

## 📊 Fluxo de Notificações

1. **pg_cron** dispara job diário às 08:00 BRT
2. Job chama a **Edge Function** `send-debt-notifications`
3. Edge Function:
   - Busca dívidas vencendo hoje/amanhã no Supabase
   - Busca tokens FCM dos usuários
   - Obtém access token via OAuth2 do Firebase Service Account
   - Envia push notifications via FCM API V1
4. **Service Worker** (`firebase-messaging-sw.js`) recebe as notificações em background
5. Usuário vê a notificação mesmo com app fechado

---

## 🔍 Como Obter as Credenciais Faltantes

### Firebase VAPID Key
1. Acesse: https://console.firebase.google.com/project/gestor-dedividas/settings/cloudmessaging
2. Vá em "Configuração da Web"
3. Copie a "Chave do par de chaves da Web"

### Supabase Anon Key
1. Acesse: https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/settings/api
2. Copie a `anon` `public` key

### Firebase Private Key (Service Account)
1. Acesse: https://console.firebase.google.com/project/gestor-dedividas/settings/serviceaccounts/adminsdk
2. Clique em "Gerar nova chave privada"
3. Baixe o arquivo JSON
4. Copie o campo `private_key` para o secret do Supabase

---

**Última atualização**: 2026-11-09
**Documentação gerada por**: Análise automática do código-fonte
