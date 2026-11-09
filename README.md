# Gestor de Dívidas Pessoais

PWA mobile-first para controle de dívidas pessoais. Funciona offline, com notificações push mesmo com o app fechado.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Banco local:** Dexie.js (IndexedDB) — offline-first
- **Hospedagem:** Firebase Hosting (plano gratuito)
- **Push notifications:** Firebase Cloud Messaging (FCM)
- **Backend:** Supabase (Edge Functions + pg_cron)

---

## Configuração

### 1. Variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env` com os valores do Firebase e Supabase (veja instruções abaixo).

### 2. Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto (plano Spark — gratuito, sem cartão)
3. Adicione um app Web → copie o `firebaseConfig` para o `.env`
4. Ative o **Cloud Messaging** → Configuração da Web → gere a **VAPID Key** → cole em `VITE_FIREBASE_VAPID_KEY`
5. Em **Cloud Messaging** → copie a **Chave do servidor** → será usada na Edge Function do Supabase como `FCM_SERVER_KEY`

### 3. Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto (plano gratuito)
2. Vá em **Settings → API** → copie `URL` e `anon key` para o `.env`
3. No **SQL Editor**, execute o arquivo `supabase/migrations/001_initial_schema.sql`
4. Substitua `SEU_PROJECT_REF` no SQL pelo ref do seu projeto Supabase
5. Em **Settings → Vault**, adicione o secret `FCM_SERVER_KEY` com a chave do servidor FCM

### 4. Deploy das Edge Functions

```bash
# Instale o CLI do Supabase
npm install -g supabase

# Login
supabase login

# Deploy das funções (use o script automatizado)
.\scripts\deploy-supabase.ps1

# Ou manualmente:
supabase functions deploy keep-alive --project-ref xdskhspqrqeraqnshuey
supabase functions deploy send-debt-notifications --project-ref xdskhspqrqeraqnshuey
```

**⚠️ Importante**: A função `keep-alive` mantém o projeto Supabase ativo (evita pausar por inatividade)

Após o deploy, configure os secrets da Edge Function no Supabase Dashboard:
**Edge Functions → send-debt-notifications → Secrets**

| Secret | Valor |
|---|---|
| `FCM_PROJECT_ID` | `gestor-dedividas` |
| `FCM_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@gestor-dedividas.iam.gserviceaccount.com` |
| `FCM_PRIVATE_KEY` | conteúdo do campo `private_key` do arquivo JSON da Service Account |

### 5. Firebase Hosting

```bash
# Instale o CLI do Firebase
npm install -g firebase-tools

# Login
firebase login

# Substitua SEU_FIREBASE_PROJECT_ID no .firebaserc pelo ID do seu projeto

# Build e deploy
npm run build
firebase deploy --only hosting
```

---

## Desenvolvimento local

```bash
npm install
npm run dev
```

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Lint do código |

---

## 🧪 Testes

### Testar notificações push
```bash
# Execute o script de teste
.\scripts\test-notifications.ps1
```

### Testar manualmente
Veja o guia completo em: **[test-push-notifications.md](./test-push-notifications.md)**

---

## 📋 Documentação

- **[CONTAS_E_SERVICOS.md](./CONTAS_E_SERVICOS.md)** - Lista de todas as contas e serviços conectados
- **[test-push-notifications.md](./test-push-notifications.md)** - Guia completo de testes de notificações

---

## Funcionalidades

- ✅ Cadastro de dívidas (única, mensal, parcelada)
- ✅ Parcelamento automático com datas incrementadas
- ✅ Marcar como paga / desfazer
- ✅ Dashboard com dívida mais urgente em destaque
- ✅ Calendário mensal com indicadores visuais
- ✅ Lista completa com filtros (todas/pendentes/pagas/vencidas)
- ✅ Notificações locais (browser)
- ✅ Push notifications com app fechado (via FCM + Supabase)
- ✅ Modo escuro
- ✅ PWA instalável no Android/iOS
- ✅ Offline-first (IndexedDB)
- ✅ Exportar dados em JSON
