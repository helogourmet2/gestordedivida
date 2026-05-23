import { initializeApp, getApps } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { firebaseConfig } from './firebase';

// Reutiliza a instância do Firebase se já existir
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Inicializa o Firebase AI Logic com Gemini Developer API
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Gemini 2.5 Flash — mais recente, gratuito, rápido
export const geminiModel = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash-preview-05-20',
});

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
