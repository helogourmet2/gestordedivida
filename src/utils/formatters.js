// Formatar valor em Reais (R$)
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

// Formatar data no padrão brasileiro DD/MM/AAAA
// Usa ISO split para evitar UTC shift (ex: 25/05 virando 24/05 no UTC-3)
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const iso = new Date(dateStr).toISOString().split('T')[0];
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

// Formatar data curta DD/MM
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const iso = new Date(dateStr).toISOString().split('T')[0];
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

// Calcular dias restantes até o vencimento
// Compara apenas a parte da data (sem hora) para evitar UTC shift
export function daysUntilDue(dateStr) {
  if (!dateStr) return 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const dueStr = new Date(dateStr).toISOString().split('T')[0];
  const today = new Date(todayStr + 'T12:00:00');
  const due = new Date(dueStr + 'T12:00:00');
  const diff = due - today;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// Texto descritivo dos dias restantes
export function daysUntilDueText(dateStr) {
  const days = daysUntilDue(dateStr);
  if (days < 0) return `Vencida há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`;
  if (days === 0) return 'Vence hoje!';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${days} dias`;
}

// Formatar input de valor monetário
export function parseCurrencyInput(value) {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Converter string YYYY-MM-DD para ISO preservando o dia no fuso local
// Salva ao meio-dia local para evitar que UTC-3 vire o dia anterior
export function localDateToISO(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toISOString();
}

// Obter data ISO para input[type=date] (YYYY-MM-DD)
export function toDateInputValue(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}
