import { useState } from 'react';
import { X, Plus, Settings2, Pencil, Trash2 } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { localDateToISO, toDateInputValue } from '../utils/formatters';
import CategoryForm from './CategoryForm';

export default function ReceivableForm({ onClose, transaction = null }) {
  const { categories: allCategories, addTransaction, updateTransaction, deleteTransactionCategory } = useTransactions();
  const categories = allCategories.filter(category => category.syncId?.startsWith('receivable-category-'));
  const [form, setForm] = useState({
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    date: toDateInputValue(transaction?.date || new Date()),
    categoryId: transaction?.categoryId?.toString() || '',
    recurrence: 'unica', installments: 2,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [manage, setManage] = useState(false);
  const [categoryForm, setCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const categoryId = categories.some(category => String(category.id) === form.categoryId)
    ? form.categoryId : String(categories[0]?.id || '');
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const input = 'w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-red-500';

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.description.trim() || !(Number(form.amount) > 0) || !form.date || !categoryId) {
      setError('Preencha descrição, valor, vencimento e categoria.'); return;
    }
    setSaving(true); setError('');
    try {
      const data = { description: form.description.trim(), amount: Number(form.amount), date: localDateToISO(form.date), categoryId: Number(categoryId), type: 'receita', isPaid: transaction?.isPaid ?? false, paidAt: transaction?.paidAt ?? null };
      if (transaction) await updateTransaction(transaction.id, data);
      else if (form.recurrence === 'parcelada') {
        const count = Number(form.installments);
        if (!Number.isInteger(count) || count < 2 || count > 120) throw new Error('Informe entre 2 e 120 parcelas.');
        const totalCents = Math.round(data.amount * 100);
        if (totalCents < count) throw new Error('O valor deve ser de pelo menos R$ 0,01 por parcela.');
        const [year, month, day] = form.date.split('-').map(Number);
        for (let i = 0; i < count; i++) {
          const lastDay = new Date(year, month - 1 + i + 1, 0).getDate();
          const date = new Date(year, month - 1 + i, Math.min(day, lastDay), 12);
          await addTransaction({ ...data, description: `${data.description} (${i + 1}/${count})`, date: date.toISOString(), amount: (Math.floor(totalCents / count) + (i < totalCents % count ? 1 : 0)) / 100 });
        }
      } else await addTransaction(data);
      onClose();
    } catch (err) { setError(err.message || 'Não foi possível salvar. Tente novamente.'); }
    finally { setSaving(false); }
  }

  return <>
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">{transaction ? 'Editar dívida a receber' : 'Nova dívida a receber'}</h2>
          <button onClick={onClose} aria-label="Fechar"><X size={22} /></button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm">Descrição / quem deve
            <input className={`${input} mt-2`} value={form.description} onChange={e => change('description', e.target.value)} placeholder="Ex: Empréstimo para João" required autoFocus />
          </label>
          <label className="block text-sm">Valor (R$)
            <input className={`${input} mt-2`} type="number" inputMode="decimal" min="0.01" step="0.01" value={form.amount} onChange={e => change('amount', e.target.value)} required />
          </label>
          <label className="block text-sm">Data de vencimento
            <input className={`${input} mt-2`} type="date" value={form.date} onChange={e => change('date', e.target.value)} required />
          </label>
          <div>
            <div className="flex justify-between items-center mb-2"><span className="text-sm">Categoria</span><button type="button" onClick={() => setManage(!manage)} className="flex gap-1 items-center text-xs"><Settings2 size={14} />{manage ? 'Fechar' : 'Gerenciar'}</button></div>
            {manage && <div className="rounded-xl border border-neutral-800 p-3 mb-3 space-y-3">
              <button type="button" className="text-red-500 flex items-center gap-1 text-sm" onClick={() => { setEditingCategory(null); setCategoryForm(true); }}><Plus size={14} /> Nova categoria</button>
              {categories.map(category => <div key={category.id} className="flex items-center justify-between text-sm">
                <span>{category.name}{category.isDefault && <small className="ml-2 text-neutral-500">padrão</small>}</span>
                <div className="flex gap-3"><button type="button" aria-label={`Editar ${category.name}`} onClick={() => { setEditingCategory(category); setCategoryForm(true); }}><Pencil size={14} /></button>
                  {!category.isDefault && <button type="button" aria-label={`Excluir ${category.name}`} onClick={async () => { try { await deleteTransactionCategory(category.id); } catch { setError('Não foi possível excluir a categoria.'); } }}><Trash2 size={14} /></button>}
                </div>
              </div>)}
            </div>}
            <div className="grid grid-cols-2 gap-2">{categories.map(category => <button type="button" key={category.id} onClick={() => change('categoryId', String(category.id))} className={`rounded-xl px-3 py-3 text-sm font-bold border-2 ${categoryId === String(category.id) ? 'bg-red-600 border-red-600' : 'bg-neutral-900 border-neutral-800'}`}>{category.name}</button>)}</div>
            {!categories.length && <p className="text-sm text-neutral-400">Crie uma categoria em Gerenciar.</p>}
          </div>
          {!transaction && <>
            <label className="block text-sm">Recorrência<select className={`${input} mt-2`} value={form.recurrence} onChange={e => change('recurrence', e.target.value)}><option value="unica">Única</option><option value="parcelada">Parcelada</option></select></label>
            {form.recurrence === 'parcelada' && <label className="block text-sm">Número de parcelas<input className={`${input} mt-2`} type="number" min="2" max="120" value={form.installments} onChange={e => change('installments', e.target.value)} required /></label>}
          </>}
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button disabled={saving} className="w-full py-3.5 rounded-xl bg-red-600 font-bold disabled:opacity-50">{saving ? 'Salvando...' : transaction ? 'Salvar alterações' : 'Adicionar dívida a receber'}</button>
        </form>
      </div>
    </div>
    {categoryForm && <CategoryForm receivable category={editingCategory} onClose={() => setCategoryForm(false)} />}
  </>;
}
