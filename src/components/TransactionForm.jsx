import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { localDateToISO } from '../utils/formatters';

export default function TransactionForm({ onClose, initialType = 'despesa', transaction = null }) {
  const { categories, addTransaction, updateTransaction } = useTransactions();
  const isEditing = !!transaction;

  const [form, setForm] = useState({
    type: transaction?.type || initialType,
    amount: transaction?.amount?.toString() || '',
    date: transaction?.date
      ? new Date(transaction.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    categoryId: transaction?.categoryId?.toString() || '',
    description: transaction?.description || '',
    isPaid: transaction?.isPaid ?? (initialType === 'receita'),
  });
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter(c => c.type === form.type);

  const handleChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Ao trocar tipo, limpa categoria se não pertencer ao novo tipo
      if (field === 'type') next.categoryId = '';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date || !form.categoryId) return;
    setSaving(true);
    try {
      const data = {
        type: form.type,
        amount: parseFloat(form.amount),
        date: localDateToISO(form.date),
        categoryId: parseInt(form.categoryId),
        description: form.description.trim(),
        isPaid: form.isPaid,
        paidAt: form.isPaid ? new Date().toISOString() : null,
      };
      if (isEditing) {
        await updateTransaction(transaction.id, data);
      } else {
        await addTransaction(data);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Editar' : 'Nova'} {form.type === 'receita' ? 'Receita' : 'Despesa'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {['receita', 'despesa'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleChange('type', t)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                  form.type === t
                    ? t === 'receita'
                      ? 'bg-green-600 text-white border-transparent'
                      : 'bg-red-600 text-white border-transparent'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
              </button>
            ))}
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Valor (R$)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={e => handleChange('amount', e.target.value)}
              placeholder="0,00"
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base font-mono"
              required
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Data
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => handleChange('date', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Categoria
            </label>
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 py-2">
                Nenhuma categoria cadastrada. Crie uma em Finanças → Categorias.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleChange('categoryId', cat.id.toString())}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border-2 text-left truncate ${
                      form.categoryId === cat.id.toString()
                        ? `${cat.color} text-white border-transparent scale-[1.02]`
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Ex: Pagamento fatura, Salário mês..."
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base"
            />
          </div>

          {/* Status pago/pendente */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('isPaid', true)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                  form.isPaid
                    ? form.type === 'receita'
                      ? 'bg-green-600 text-white border-transparent'
                      : 'bg-green-600 text-white border-transparent'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {form.type === 'receita' ? '✓ Recebido' : '✓ Pago'}
              </button>
              <button
                type="button"
                onClick={() => handleChange('isPaid', false)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                  !form.isPaid
                    ? 'bg-orange-500 text-white border-transparent'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                ⏳ Pendente
              </button>
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={saving || !form.amount || !form.categoryId}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus size={20} />
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  );
}
