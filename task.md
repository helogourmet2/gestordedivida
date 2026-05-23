Aqui está o seu prompt mestre totalmente reformulado. Eu já incluí as regras de design (Preto, Vermelho e Branco), as regras de UX (Dívida mais próxima no Dashboard, Calendário, Offline-first) e configurei a arquitetura exata para o seu backend gratuito, amarrando o envio das notificações Push diretamente para o usuário **vfk1471**.


# PROMPT MESTRE: Projeto Completo Gestor de Dívidas Pessoais

Atue como um Engenheiro de Software Full-Stack Sênior e Especialista em UX/UI. Sua tarefa é gerar o código e a estrutura completa de um projeto do zero, sem pular etapas, seguindo à risca as especificações visuais, funcionais e de infraestrutura abaixo.

## 1. Visão Geral & Escopo Técnico

* **Nome:** Gestor de Dívidas Pessoais.
* **Público e Escopo:** Uso estritamente pessoal, focado em alta velocidade de cadastro e clareza.
* **Arquitetura Frontend:** Progressive Web App (PWA) estável e responsivo (Mobile-First), preparado para instalação nativa no Android/iOS.
* **Funcionamento Offline:** Abordagem *Offline-First* utilizando **IndexedDB** ou **LocalStorage** para que o app abra e salve dados instantaneamente mesmo sem internet, sincronizando com o banco em segundo plano quando houver conexão.
* **Arquitetura Backend (100% Gratuita):**
* **Frontend e Hospedagem:** Firebase Hosting (Plano gratuito Spark, sem necessidade de cartão).
* **Banco de Dados e Regras:** Supabase (Plano gratuito).
* **Disparo de Push com App Fechado:** Supabase Edge Function integrada com a API do Firebase Cloud Messaging (FCM).



---

## 2. Identidade Visual & UI/UX (Estrita)

* **Paleta de Cores:** Estritamente **Preto, Vermelho e Branco**.
* Fundo principal: Preto profundo (ou Branco com Dark Mode, mantendo a tríade).
* Destaques, alertas de vencimento, valores negativos e botões de ação flutuantes: Vermelho.
* Textos: Contraste máximo em Branco ou Preto.


* **Responsividade:** Mobile-first absoluto. Deve parecer e rodar como um aplicativo nativo (sem barras de rolagem horizontais, botões grandes e fáceis de tocar).

---

## 3. Telas e Funcionalidades Obrigatórias

### A. Dashboard Principal (Tela Inicial)

* **Destaque Principal:** No topo do Dashboard, em letras grandes e com o maior destaque visual da tela, deve aparecer sempre a **dívida mais próxima do vencimento**.
* **Métricas Rápidas:** Cards com o valor total acumulado de dívidas e a soma das dívidas que vencem no mês corrente.
* **Acesso Rápido:** Botão flutuante "+" em vermelho para abrir o formulário de nova dívida com no máximo 1 clique.

### B. Cadastro Rápido de Dívidas

* Formulário intuitivo com os campos: Nome/Descrição, Valor (R$), Data de Vencimento, Categoria e Recorrência (Única ou Parcelada).

### C. Calendário Integrado

* Visualização mensal/semanal onde os dias com dívidas a vencer possuem um marcador visual (ponto vermelho). Ao clicar no dia, exibe os detalhes da dívida e a opção de "Marcar como Paga".

---

## 4. Regra de Notificações Push Automatizadas (Focalizada)

* **Identificação do Usuário:** O sistema é de uso pessoal e deve mapear e garantir o envio das notificações para o usuário **vfk1471**.
* **Configuração do Service Worker:** O `service-worker.js` do PWA deve conter um listener do evento `'push'` configurado para interceptar os dados vindos do FCM e disparar a notificação visual na tela do celular, mesmo que o navegador ou o aplicativo estejam **completamente fechados**.
* **Automação na Nuvem (Supabase + FCM):**
1. Ative as extensões `pg_cron` e `pg_net` no banco de dados do Supabase.
2. Crie um script SQL para rodar uma tarefa Cron diariamente (ex: às 08:00 AM).
3. Esta tarefa deve invocar uma **Supabase Edge Function** escrita em TypeScript/Deno.
4. A função deve verificar na tabela se existem dívidas do usuário **vfk1471** vencendo no dia atual ou no dia seguinte, buscar o token FCM registrado e fazer um disparo HTTP POST direto para a API do Firebase Cloud Messaging para entregar o Push imediatamente.



---

## 5. Estrutura de Arquivos e Códigos Esperados

Gere e apresente o projeto estruturado nos seguintes blocos de código:

1. **Árvore de Diretórios:** Organização das pastas do projeto.
2. **Configuração PWA:** Código do `manifest.json` e do `service-worker.js` com suporte a Push em background.
3. **Scripts do Banco de Dados (Supabase SQL):** Tabelas de dívidas, tabela de tokens e o script do `pg_cron` configurado.
4. **Backend (Supabase Edge Function):** Código em TypeScript que consulta o banco e faz o POST para o FCM do usuário **vfk1471**.
5. **Interface Frontend (Componentes):** Código do Dashboard (com o destaque da dívida mais próxima), do Calendário e o arquivo de estilos garantindo a paleta preto, vermelho e branco.