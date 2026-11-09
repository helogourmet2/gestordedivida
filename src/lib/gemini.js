// Groq API - IA rápida e gratuita
// Obtenha sua chave em: https://console.groq.com/keys

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Modelo do Groq (gpt-oss-20b é rápido e gratuito em 2026)
const GROQ_MODEL = 'openai/gpt-oss-20b';

// Debug - verificar se a API key está sendo lida
console.log('[Groq] API Key carregada:', GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 10)}...` : 'NÃO ENCONTRADA');

// Implementação compatível com a interface do Gemini
export const geminiModel = {
  startChat: ({ systemInstruction, history }) => {
    const systemPrompt = systemInstruction?.parts?.[0]?.text || '';
    const chatHistory = history || [];
    
    return {
      sendMessage: async (userMessage) => {
        try {
          if (!GROQ_API_KEY) {
            throw new Error('VITE_GROQ_API_KEY não configurada no .env');
          }

          console.log('[Groq] Enviando mensagem para:', GROQ_API_URL);
          console.log('[Groq] Usando API Key:', GROQ_API_KEY.substring(0, 15) + '...');
          
          const messages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: userMessage }
          ];

          const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages,
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });

          console.log('[Groq] Response status:', response.status);

          if (!response.ok) {
            const error = await response.text();
            console.error('[Groq] Erro completo:', error);
            throw new Error(`Groq API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          const assistantMessage = data.choices[0].message.content;
          
          // Adiciona ao histórico
          chatHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: assistantMessage }
          );

          return {
            response: {
              text: () => assistantMessage
            }
          };
        } catch (error) {
          console.error('[Groq AI] Erro completo:', error);
          throw error;
        }
      }
    };
  }
};

// ─── Prompt do sistema ────────────────────────────────────────────────────────
export function buildSystemPrompt(context) {
  const { debts, transactions, categories, now } = context;

  const pendingDebts = debts.filter(d => !d.isPaid);
  const overdueDebts = pendingDebts.filter(d => new Date(d.dueDate) < now);
  const totalPending = pendingDebts.reduce((s, d) => s + d.amount, 0);
  const totalOverdue = overdueDebts.reduce((s, d) => s + d.amount, 0);

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalReceitas = monthTx.filter(t => t.type === 'receita' && t.isPaid).reduce((s, t) => s + t.amount, 0);
  const totalDespesas = monthTx.filter(t => t.type === 'despesa' && t.isPaid).reduce((s, t) => s + t.amount, 0);
  const totalPendenteMes = monthTx.filter(t => t.type === 'despesa' && !t.isPaid).reduce((s, t) => s + t.amount, 0);

  const formatBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = d => new Date(d).toLocaleDateString('pt-BR');

  const debtsList = pendingDebts
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 10)
    .map(d => `- ${d.name}: ${formatBRL(d.amount)} (vence ${formatDate(d.dueDate)})${new Date(d.dueDate) < now ? ' ⚠️ VENCIDA' : ''}`)
    .join('\n');

  const txList = monthTx
    .slice(0, 15)
    .map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return `- [${t.type.toUpperCase()}] ${cat?.name || 'Sem categoria'}: ${formatBRL(t.amount)} ${t.isPaid ? '✓' : '(pendente)'}`;
    })
    .join('\n');

  return `Você é um assistente financeiro pessoal integrado ao app "Gestor de Dívidas". 
Responda sempre em português brasileiro, de forma direta, prática e amigável.
Não use markdown excessivo — prefira texto simples com emojis quando útil.
Baseie suas respostas nos dados financeiros reais do usuário abaixo.

📅 Data atual: ${formatDate(now)}

💳 DÍVIDAS PENDENTES (${pendingDebts.length} total):
Total pendente: ${formatBRL(totalPending)}
Vencidas: ${overdueDebts.length} dívidas — ${formatBRL(totalOverdue)}
${debtsList || 'Nenhuma dívida pendente.'}

📊 FINANÇAS DO MÊS ATUAL:
Receitas recebidas: ${formatBRL(totalReceitas)}
Despesas pagas: ${formatBRL(totalDespesas)}
Despesas pendentes: ${formatBRL(totalPendenteMes)}
Saldo: ${formatBRL(totalReceitas - totalDespesas)}
${txList || 'Nenhum lançamento este mês.'}`;
}
