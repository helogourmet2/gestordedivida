# 📚 Índice da Documentação - Gestor de Dívidas

## 🚀 Por Onde Começar?

### Se você é novo no projeto:
1. 📖 Leia **[RESUMO_CONTAS.md](./RESUMO_CONTAS.md)** - Visão geral e próximos passos
2. 📊 Veja **[STATUS_ATUAL.md](./STATUS_ATUAL.md)** - O que está feito e o que falta
3. ⚙️ Siga o **[RESUMO_CONTAS.md](./RESUMO_CONTAS.md)** - Plano de ação passo a passo

### Se você quer configurar as notificações push:
1. 🔔 Leia **[test-push-notifications.md](./test-push-notifications.md)** - Guia completo
2. 🧪 Execute **`.\scripts\check-status.ps1`** - Verificar o que precisa
3. 🚀 Execute **`.\scripts\deploy-supabase.ps1`** - Deploy automático

### Se você está com problemas:
1. 🔧 Consulte **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Soluções detalhadas
2. 🧪 Execute **`.\scripts\test-notifications.ps1`** - Testar o sistema

---

## 📑 Documentação Completa

### 📋 Documentação Principal

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **[README.md](./README.md)** | Documentação oficial do projeto | Setup inicial, comandos básicos |
| **[RESUMO_CONTAS.md](./RESUMO_CONTAS.md)** | Resumo executivo das contas | Primeiro contato, plano de ação |
| **[STATUS_ATUAL.md](./STATUS_ATUAL.md)** | Status atual do projeto | Ver o que está completo |
| **[CONTAS_E_SERVICOS.md](./CONTAS_E_SERVICOS.md)** | Detalhes técnicos completos | Referência técnica profunda |
| **[test-push-notifications.md](./test-push-notifications.md)** | Guia de testes de notificações | Configurar e testar push |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Solução de problemas | Quando algo não funciona |
| **[INDEX.md](./INDEX.md)** | Este arquivo - índice geral | Navegação rápida |

---

## 🛠️ Scripts PowerShell

### Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| **Check Status** | `.\scripts\check-status.ps1` | Verifica status completo do sistema |
| **Deploy Supabase** | `.\scripts\deploy-supabase.ps1` | Deploy automático das Edge Functions |
| **Test Notifications** | `.\scripts\test-notifications.ps1` | Testa notificações push |

### Como Usar os Scripts

```powershell
# 1. Verificar status geral
.\scripts\check-status.ps1

# 2. Deploy das funções Supabase
.\scripts\deploy-supabase.ps1

# 3. Testar notificações
.\scripts\test-notifications.ps1
```

---

## 🗂️ Código-Fonte

### Estrutura do Projeto

```
gestor-de-dividas/
├── 📄 Documentação
│   ├── README.md
│   ├── RESUMO_CONTAS.md
│   ├── STATUS_ATUAL.md
│   ├── CONTAS_E_SERVICOS.md
│   ├── test-push-notifications.md
│   ├── TROUBLESHOOTING.md
│   └── INDEX.md (este arquivo)
│
├── 🛠️ Scripts
│   └── scripts/
│       ├── check-status.ps1
│       ├── deploy-supabase.ps1
│       └── test-notifications.ps1
│
├── 🔥 Firebase
│   ├── .firebaserc
│   ├── firebase.json
│   ├── public/firebase-messaging-sw.js
│   └── src/lib/firebase.js
│
├── 🗄️ Supabase
│   ├── supabase/functions/
│   │   ├── keep-alive/index.ts
│   │   └── send-debt-notifications/index.ts
│   ├── supabase/migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_keep_alive_cron.sql
│   └── src/lib/supabase.js
│
└── 📦 Configuração
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── playwright.config.js
```

---

## 🎯 Guias Rápidos

### 🚀 Setup Inicial (Nova Máquina)

```bash
# 1. Clonar repositório
git clone https://github.com/helogourmet2/gestordedivida.git
cd gestordedivida

# 2. Instalar dependências
npm install

# 3. Configurar .env
cp .env.example .env
# Editar .env com suas credenciais

# 4. Instalar CLIs
npm install -g firebase-tools supabase

# 5. Verificar status
.\scripts\check-status.ps1
```

### 🔔 Configurar Notificações Push

```bash
# 1. Deploy Supabase
.\scripts\deploy-supabase.ps1

# 2. Configurar secrets no Supabase Dashboard
# (ver test-push-notifications.md)

# 3. Executar migrations SQL
# (no Supabase SQL Editor)

# 4. Testar
.\scripts\test-notifications.ps1
```

### 🧪 Desenvolvimento Local

```bash
# Rodar servidor de desenvolvimento
npm run dev

# Rodar testes E2E
npm run test:e2e

# Build de produção
npm run build

# Preview do build
npm run preview
```

### 🚀 Deploy em Produção

```bash
# Build
npm run build

# Deploy Firebase Hosting
firebase deploy --only hosting

# Deploy Supabase Functions
.\scripts\deploy-supabase.ps1
```

---

## 🔗 Links Importantes

### 🔐 Contas
- **Email**: helogourmet2@gmail.com
- **Firebase Projeto**: gestor-dedividas
- **Supabase Projeto**: xdskhspqrqeraqnshuey

### 🌐 Dashboards

#### Firebase
- [Console Principal](https://console.firebase.google.com/project/gestor-dedividas)
- [Cloud Messaging](https://console.firebase.google.com/project/gestor-dedividas/settings/cloudmessaging)
- [Authentication](https://console.firebase.google.com/project/gestor-dedividas/authentication)
- [Hosting](https://console.firebase.google.com/project/gestor-dedividas/hosting)
- [Service Accounts](https://console.firebase.google.com/project/gestor-dedividas/settings/serviceaccounts/adminsdk)

#### Supabase
- [Dashboard Principal](https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey)
- [Edge Functions](https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/functions)
- [Database (Editor)](https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/editor)
- [SQL Editor](https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/sql)
- [API Settings](https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/settings/api)
- [Logs](https://supabase.com/dashboard/project/xdskhspqrqeraqnshuey/logs/explorer)

#### GitHub
- [Repositório](https://github.com/helogourmet2/gestordedivida)

---

## 📊 Status Rápido

### ✅ Completado
- Identificação de contas (Firebase, Supabase, GitHub)
- Documentação completa
- Scripts de automação
- Função keep-alive para Supabase
- Migrations SQL

### ⏳ Em Progresso
- Configuração do .env
- Deploy das Edge Functions
- Configuração dos secrets

### 📋 A Fazer
- Testes de notificações push
- Deploy em produção
- Verificação final

---

## 🆘 Precisa de Ajuda?

### Por Ordem de Prioridade:

1. **Erro específico?**
   - Consulte **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

2. **Não sabe por onde começar?**
   - Leia **[RESUMO_CONTAS.md](./RESUMO_CONTAS.md)**

3. **Quer configurar notificações?**
   - Siga **[test-push-notifications.md](./test-push-notifications.md)**

4. **Precisa de detalhes técnicos?**
   - Veja **[CONTAS_E_SERVICOS.md](./CONTAS_E_SERVICOS.md)**

5. **Quer ver o status atual?**
   - Execute `.\scripts\check-status.ps1`
   - Ou leia **[STATUS_ATUAL.md](./STATUS_ATUAL.md)**

---

## 📝 Comandos Mais Usados

```bash
# Desenvolvimento
npm run dev                           # Servidor local
npm run build                         # Build produção
npm run preview                       # Preview do build

# Verificação e Testes
.\scripts\check-status.ps1            # Status do sistema
.\scripts\test-notifications.ps1      # Testar push

# Deploy
.\scripts\deploy-supabase.ps1         # Deploy Supabase
firebase deploy --only hosting        # Deploy Firebase

# Firebase
firebase login                        # Login Firebase
firebase projects:list                # Listar projetos

# Supabase
supabase login                        # Login Supabase
supabase functions list               # Listar funções
supabase functions deploy <nome>      # Deploy função
```

---

## 🔄 Fluxo de Trabalho Recomendado

### Para Nova Feature
1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Desenvolver localmente: `npm run dev`
3. Testar: `npm run test:e2e`
4. Commit e push
5. Criar PR no GitHub

### Para Deploy
1. Verificar status: `.\scripts\check-status.ps1`
2. Build: `npm run build`
3. Deploy backend: `.\scripts\deploy-supabase.ps1`
4. Deploy frontend: `firebase deploy --only hosting`
5. Testar em produção: `.\scripts\test-notifications.ps1`

---

**Criado em**: 2026-11-09  
**Versão da Documentação**: 1.0  
**Última Atualização**: 2026-11-09
