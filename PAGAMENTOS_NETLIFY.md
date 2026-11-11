# Configuração do pagamento vitalício no Netlify

O aplicativo oferece três meses de calendário gratuitos, contados no primeiro acesso autenticado depois da ativação desta funcionalidade. O prazo é salvo no Supabase e não reinicia ao trocar de aparelho ou reinstalar. Exemplo: primeiro acesso em 10/11/2026 termina em 10/02/2027. Depois, o acesso vitalício custa R$ 10,00, em pagamento único via Pix; não há assinatura ou cobrança automática.

## 1. Netlify: variáveis das funções

Abra o projeto guileless-baklava-7ff1a1 → Project configuration → Environment variables → Add a variable. Use o contexto Production para o site público. Inclua o escopo Functions em todas as variáveis desta tabela. Marque os valores secretos como segredo. Não use prefixo VITE_ para estas chaves.

| Nome exato | Valor / onde obter | Segredo? |
| --- | --- | --- |
| MP_ACCESS_TOKEN | Access Token de produção da aplicação Mercado Pago, em Suas integrações → aplicação → Credenciais de produção | Sim |
| MP_WEBHOOK_SECRET | Assinatura secreta gerada em Configuração de Webhooks no Mercado Pago | Sim |
| MP_ENVIRONMENT | production | Não |
| SUPABASE_URL | https://xdskhspqrqeraqnshuey.supabase.co | Não |
| SUPABASE_SERVICE_ROLE_KEY | Supabase → projeto → Settings → API Keys → chave legada service_role. Não use anon. | Sim, acesso administrativo |
| FIREBASE_PROJECT_ID | gestor-dedividas | Não |

Se o plano do Netlify não oferecer seleção de escopos, use a variável no projeto, mantenha os segredos fora de nomes VITE_ e fora do código. O frontend importa somente as variáveis VITE_; as funções leem as demais no servidor. Não coloque chaves em netlify.toml.

O preço de R$ 10,00 é definido no código do servidor. Não existe variável de preço editável no navegador. Não é necessário MP_PUBLIC_KEY, Client Secret nem uma variável com a chave Pix: a criação da cobrança usa o Access Token no servidor. A chave Pix precisa estar cadastrada na conta Mercado Pago recebedora.

## 2. Variáveis de compilação do aplicativo

Mantenha as variáveis já usadas no Firebase Hosting, agora no painel do Netlify. Inclua o escopo Builds:

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID (gestor-dedividas)
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_VAPID_KEY (notificações)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Copie os valores correspondentes à configuração atual do aplicativo. Essas chaves de configuração do Firebase e a chave anon do Supabase são as usadas pelo cliente; não substitua anon por service_role.

Adicione VITE_BILLING_ENABLED com valor false inicialmente. Só mude para true depois de executar o SQL, salvar todas as variáveis das funções, configurar o webhook e verificar o fluxo. Ao mudar essa variável é necessário fazer um novo deploy; ela é incorporada durante a compilação. false significa que a cobrança e a contagem do teste ainda não estão ativadas no aplicativo, não uma versão de teste do Mercado Pago.

A configuração da IA existente deve ser preservada na migração; esta alteração não migra o provedor de IA.

## 3. Banco de dados: executar uma vez

No SQL Editor do Supabase, abra uma nova consulta e execute integralmente supabase/migrations/005_billing.sql deste repositório. O arquivo cria:

- billing_accounts: início e fim do teste, vinculados ao UID do Firebase;
- billing_payments: pedidos Pix, ambiente e estado de confirmação;
- funções para iniciar o teste uma única vez e reutilizar a cobrança pendente.

As tabelas têm RLS ativada, sem acesso direto de anon/authenticated. Somente service_role pode lê-las e alterá-las. Nenhum registro de dívida, finanças ou categoria é apagado. Não execute o arquivo novamente depois de criado com sucesso.

## 4. Mercado Pago: aplicação e webhook

Use Checkout Transparente / Checkout API, com API de Orders. Cadastre uma chave Pix na conta recebedora do Mercado Pago.

Em Suas integrações → sua aplicação → Configuração de Webhooks:

1. Selecione Produção.
2. URL: https://guileless-baklava-7ff1a1.netlify.app/.netlify/functions/mercadopago-webhook
3. Selecione o evento Order (Mercado Pago).
4. Salve e revele a assinatura secreta.
5. Salve essa assinatura em MP_WEBHOOK_SECRET no Netlify.

Não selecione o evento Pagamentos da integração legada como substituto de Order. A assinatura do webhook é validada e o pedido é consultado novamente na API do Mercado Pago. Somente um pedido correspondente à compra, em reais, no valor exato de R$ 10 e com Pix integralmente creditado libera o vitalício. Reembolso/cancelamento atualizado pelo webhook retira a liberação; o período gratuito original continua com a mesma data.

## 5. Firebase: permitir o domínio Netlify

Firebase Console → Authentication → Settings → Authorized domains → Add domain:

guileless-baklava-7ff1a1.netlify.app

Use somente o domínio, sem https:// e sem caminho. O login continua usando o Firebase. A configuração VITE_FIREBASE_AUTH_DOMAIN continua sendo a do projeto Firebase; não a substitua pelo domínio do Netlify.

## 6. Publicação e conferência

O repositório contém netlify.toml com build npm run build, publicação dist e funções em netlify/functions. O redirecionamento para index.html mantém as rotas do aplicativo. O arquivo inclui o cabeçalho necessário para o popup de login do Google.

1. Execute a migração SQL e configure as variáveis.
2. Publique no Netlify com VITE_BILLING_ENABLED=false e confira que as funções aparecem no painel.
3. Configure o webhook, incluindo o segredo, e publique novamente.
4. Para homologação, use um deploy separado, credenciais de teste, MP_ENVIRONMENT=test e webhook de teste. Não misture credenciais e ambiente. Em teste o servidor usa o pagador APRO do Mercado Pago; nunca pague um QR de teste. Um pagamento de teste não é considerado uma compra de produção no banco.
5. Para produção, use as credenciais de produção, MP_ENVIRONMENT=production e VITE_BILLING_ENABLED=true e faça novo deploy.
6. Entre com Google: Configurações deve mostrar a data final do teste e o botão de acesso vitalício.
7. Teste a geração do Pix e, com um comprador real diferente da conta recebedora, faça uma compra real de R$ 10 quando estiver pronto. Verifique o webhook, a confirmação e o estado vitalício. Gerar o Pix não confirma pagamento.
8. Teste reenvio do webhook: não deve duplicar a compra. Teste também cancelamento/reembolso antes da abertura pública.

O aplicativo precisa de internet para consultar o acesso ao entrar. Após terminar o teste, os registros não são apagados e Configurações permanece acessível para exportação. A compra fica vinculada à conta Google, não ao aparelho.

O domínio antigo Firebase não hospeda Netlify Functions. Esta versão de cobrança deve ser usada pelo domínio Netlify; não ative VITE_BILLING_ENABLED=true em um deploy do Firebase sem configurar um backend equivalente. O armazenamento local é separado por domínio; entre com a mesma conta e confira a sincronização e exporte os registros antes de migrar o uso diário.

## Referências oficiais

- Pix com Orders: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/pix
- Webhooks de Orders: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications
- Teste de Pix: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test/pix
- Variáveis das funções: https://docs.netlify.com/build/functions/environment-variables/
- Validação de Firebase ID Token: https://firebase.google.com/docs/auth/admin/verify-id-tokens
