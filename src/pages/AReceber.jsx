import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, toDateInputValue } from '../utils/formatters';
import TransactionCard from '../components/TransactionCard';
import ReceivableForm from '../components/ReceivableForm';
import EmptyState from '../components/EmptyState';
import Financas from './Financas';

const filters = [{ id: 'todas', label: 'Todas' }, { id: 'pendentes', label: 'Pendentes' }, { id: 'recebidas', label: 'Recebidas' }, { id: 'vencidas', label: 'Vencidas' }];

export default function AReceber() {
  const { allTransactions, categories, deleteTransaction, markTransactionAsPaid, markTransactionAsUnpaid } = useTransactions();
  const [filter, setFilter] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(false);
  const [error, setError] = useState('');
  const categoryIds = new Set(categories.filter(category => category.syncId?.startsWith('receivable-category-')).map(category => category.id));
  const receivables = allTransactions.filter(item => categoryIds.has(item.categoryId));
  const legacy = allTransactions.filter(item => !categoryIds.has(item.categoryId));
  const today = toDateInputValue(new Date());
  const filtered = receivables.filter(item => {
    if (filter === 'pendentes') return !item.isPaid;
    if (filter === 'recebidas') return item.isPaid;
    if (filter === 'vencidas') return !item.isPaid && toDateInputValue(item.date) < today;
    return true;
  });
  const total = paid => receivables.filter(item => item.isPaid === paid).reduce((sum, item) => sum + item.amount, 0);
  async function action(fn) { try { setError(''); await fn(); } catch { setError('Não foi possível concluir. Tente novamente.'); } }

  return <div className="space-y-4">
    <h2 className="text-xl font-black">Dívidas a receber</h2>
    <div className="grid grid-cols-2 gap-3">
      {[['A receber', total(false)], ['Recebido', total(true)]].map(([label, value]) => <div key={label} className="rounded-2xl p-4 bg-neutral-900 border border-neutral-800"><p className="text-xs uppercase text-neutral-400 font-bold">{label}</p><p className="mt-2 text-xl font-black font-mono">{formatCurrency(value)}</p></div>)}
    </div>
    <button className="w-full rounded-xl bg-red-600 py-3 font-bold" onClick={() => { setEditing(null); setShowForm(true); }}>+ Nova dívida a receber</button>
    <div className="flex gap-2 overflow-x-auto pb-1">{filters.map(option => <button key={option.id} onClick={() => setFilter(option.id)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${filter === option.id ? 'bg-red-600' : 'bg-neutral-900 text-neutral-400'}`}>{option.label}</button>)}</div>
    <div className="flex justify-between text-sm text-neutral-400"><span>{filtered.length} registro(s)</span><span>{formatCurrency(filtered.reduce((sum, item) => sum + item.amount, 0))}</span></div>
    {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
    {filtered.length ? <div className="space-y-2">{filtered.map(item => <TransactionCard key={item.id} transaction={item} category={categories.find(category => category.id === item.categoryId)} onEdit={() => { setEditing(item); setShowForm(true); }} onDelete={() => { if (confirm('Excluir esta dívida a receber?')) action(() => deleteTransaction(item.id)); }} onMarkPaid={() => action(() => markTransactionAsPaid(item.id))} onMarkUnpaid={() => action(() => markTransactionAsUnpaid(item.id))} />)}</div> : <EmptyState title="Nenhuma dívida a receber" description="Toque em + para cadastrar ou altere o filtro." />}
    {legacy.length > 0 && <div className="pt-4 border-t border-neutral-800"><button className="text-sm text-neutral-400" onClick={() => setHistory(!history)}>{history ? 'Fechar' : 'Ver'} histórico de Finanças ({legacy.length})</button>{history && <div className="mt-4"><Financas legacyOnly /></div>}</div>}
    {showForm && <ReceivableForm transaction={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}
  </div>;
}
