import { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { CATEGORIES, RECURRENCE_OPTIONS } from '../utils/constants';
import { addDebt, updateDebt } from '../db/database';
import { toDateInputValue } from '../utils/formatters';

export default function DebtForm({ onClose, debt = null }) {
  const isEditing = !!debt;

  const [form, setForm] = useState({
    name: debt?.name || '',
    amount: debt?.amount?.toString() || '',
    dueDate: debt?.dueDate ? toDateInputValue(debt.dueDate) : new Date().toISOString().split('T')[0],
    category: debt?.category || 'essencial',
    recurrence: debt?.recurrence || 'unica',
    installments: debt?.installments || 2,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount || !form.dueDate) return;

    setSaving(true);
    try {
      if (isEditing) {
        await updateDebt(debt.id, {
          name: form.name.trim(),
          amount: parseFloat(form.amount),
          dueDate: new Date(form.dueDate).toISOString(),
          category: form.category,
          recurrence: form.recurrence,
          installments: form.recurrence === 'parcelada' ? parseInt(form.installments) : debt.installments,
        });
      } else {
        await addDebt({
          name: form.name.trim(),
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
          category: form.category,
          recurrence: form.recurrence,
          installments: form.recurrence === 'parcelada' ? parseInt(form.installments) : null,
        });
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar dívida:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0f2040] rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto border border-[#1a3366]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Editar Dívida' : 'Nova Dívida'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#152a55] transition-colors text-[#b8cef0]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-[#b8cef0] mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Cartão de Crédito, Aluguel..."
              className="w-full px-4 py-3 rounded-xl bg-[#152a55] border border-[#1a3366] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base text-white placeholder-[#6b93d6]"
              autoFocus
              required
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-[#b8cef0] mb-1.5">
              Valor (R$)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="0,00"
              className="w-full px-4 py-3 rounded-xl bg-[#152a55] border border-[#1a3366] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base font-mono text-white placeholder-[#6b93d6]"
              required
            />
          </div>

          {/* Data de Vencimento */}
          <div>
            <label className="block text-sm font-medium text-[#b8cef0] mb-1.5">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#152a55] border border-[#1a3366] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base text-white"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-[#b8cef0] mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleChange('category', cat.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 border-2 ${
                    form.category === cat.id
                      ? `${cat.color} text-white border-transparent scale-105`
                      : 'bg-[#152a55] border-[#1a3366] text-[#b8cef0]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recorrência */}
          <div>
            <label className="block text-sm font-medium text-[#b8cef0] mb-1.5">
              Recorrência
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RECURRENCE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('recurrence', opt.id)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 ${
                    form.recurrence === opt.id
                      ? 'bg-red-600 text-white border-transparent'
                      : 'bg-[#152a55] border-[#1a3366] text-[#b8cef0]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parcelas */}
          {form.recurrence === 'parcelada' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-[#b8cef0] mb-1.5">
                Número de Parcelas
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="2"
                max="120"
                value={form.installments}
                onChange={(e) => handleChange('installments', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#152a55] border border-[#1a3366] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-base font-mono text-white"
              />
              <p className="text-xs text-[#6b93d6] mt-1.5">
                Valor por parcela: R$ {form.amount ? (parseFloat(form.amount) / parseInt(form.installments || 1)).toFixed(2) : '0,00'}
              </p>
            </div>
          )}

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={saving || !form.name.trim() || !form.amount}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-[#152a55] disabled:text-[#6b93d6] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isEditing ? <Save size={20} /> : <Plus size={20} />}
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar Dívida'}
          </button>
        </form>
      </div>
    </div>
  );
}
