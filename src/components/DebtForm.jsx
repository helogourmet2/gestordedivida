import { useState } from 'react';
import { X, Plus, Save, Settings2, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { RECURRENCE_OPTIONS } from '../utils/constants';
import { addDebt, updateDebt } from '../db/database';
import { toDateInputValue, localDateToISO } from '../utils/formatters';
import { useDebtCategories } from '../hooks/useDebtCategories';
import DebtCategoryForm from './DebtCategoryForm';

const inputStyle = {
  background: 'var(--card-2)',
  border: '1px solid var(--border)',
  color: 'var(--white)',
  outline: 'none',
};

export default function DebtForm({ onClose, debt = null }) {
  const isEditing = !!debt;
  const { categories, deleteDebtCategory } = useDebtCategories();

  const [form, setForm] = useState({
    name: debt?.name || '',
    amount: debt?.amount?.toString() || '',
    dueDate: debt?.dueDate ? toDateInputValue(debt.dueDate) : new Date().toISOString().split('T')[0],
    categoryId: debt?.categoryId?.toString() || '',
    recurrence: debt?.recurrence || 'unica',
    installments: debt?.installments || 2,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCatManager, setShowCatManager] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  const effectiveCategoryId = form.categoryId || (categories[0]?.id?.toString() ?? '');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Informe a descrição da dívida';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Informe um valor maior que zero';
    if (!form.dueDate) errs.dueDate = 'Informe a data de vencimento';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const catId = parseInt(effectiveCategoryId);
      if (isEditing) {
        await updateDebt(debt.id, {
          name: form.name.trim(),
          amount: parseFloat(form.amount),
          dueDate: localDateToISO(form.dueDate),
          categoryId: catId,
          recurrence: form.recurrence,
          installments: form.recurrence === 'parcelada' ? parseInt(form.installments) : debt.installments,
        });
      } else {
        await addDebt({
          name: form.name.trim(),
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
          categoryId: catId,
          recurrence: form.recurrence,
          installments: form.recurrence === 'parcelada' ? parseInt(form.installments) : null,
        });
      }
      setSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch (error) {
      console.error('Erro ao salvar dívida:', error);
      setErrors({ submit: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { color: '#a0a0a0', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
          style={{ background: '#111111', border: '1px solid #2a2a2a' }}>

          {/* ── Feedback de sucesso ── */}
          {success && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-t-3xl sm:rounded-3xl"
              style={{ background: '#111111' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(229,0,0,0.15)' }}>
                <CheckCircle2 size={36} style={{ color: '#e50000' }} />
              </div>
              <p className="text-lg font-black" style={{ color: '#fff' }}>
                {isEditing ? 'Dívida atualizada!' : 'Dívida adicionada!'}
              </p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black" style={{ color: '#fff' }}>
              {isEditing ? 'Editar Dívida' : 'Nova Dívida'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl"
              style={{ background: '#1a1a1a', color: '#a0a0a0' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nome */}
            <div>
              <label style={labelStyle}>Descrição</label>
              <input type="text" value={form.name}
                onChange={e => { handleChange('name', e.target.value); if (errors.name) setErrors(p => ({...p, name: ''})); }}
                placeholder="Ex: Cartão de Crédito, Aluguel..."
                className="w-full px-4 py-3 rounded-xl text-base transition-all"
                style={{ ...inputStyle, borderColor: errors.name ? '#e50000' : '#2a2a2a' }}
                autoFocus />
              {errors.name && <p className="text-xs mt-1 font-semibold" style={{ color: '#e50000' }}>{errors.name}</p>}
            </div>

            {/* Valor */}
            <div>
              <label style={labelStyle}>Valor (R$)</label>
              <input type="number" inputMode="decimal" step="0.01" min="0.01"
                value={form.amount} onChange={e => { handleChange('amount', e.target.value); if (errors.amount) setErrors(p => ({...p, amount: ''})); }}
                placeholder="0,00"
                className="w-full px-4 py-3 rounded-xl text-base font-mono transition-all"
                style={{ ...inputStyle, fontFamily: 'monospace', borderColor: errors.amount ? '#e50000' : '#2a2a2a' }} />
              {errors.amount && <p className="text-xs mt-1 font-semibold" style={{ color: '#e50000' }}>{errors.amount}</p>}
            </div>

            {/* Data */}
            <div>
              <label style={labelStyle}>Data de Vencimento</label>
              <input type="date" value={form.dueDate}
                onChange={e => { handleChange('dueDate', e.target.value); if (errors.dueDate) setErrors(p => ({...p, dueDate: ''})); }}
                className="w-full px-4 py-3 rounded-xl text-base transition-all"
                style={{ ...inputStyle, borderColor: errors.dueDate ? '#e50000' : '#2a2a2a' }} />
              {errors.dueDate && <p className="text-xs mt-1 font-semibold" style={{ color: '#e50000' }}>{errors.dueDate}</p>}
            </div>

            {/* Categoria */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Categoria</label>
                <button type="button" onClick={() => setShowCatManager(v => !v)}
                  className="flex items-center gap-1 text-xs font-semibold transition-colors"
                  style={{ color: 'var(--gray-2)' }}>
                  <Settings2 size={13} />
                  {showCatManager ? 'Fechar' : 'Gerenciar'}
                </button>
              </div>

              {showCatManager && (
                <div className="mb-3 rounded-xl overflow-hidden animate-fade-in"
                  style={{ background: 'var(--card-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-3 py-2"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-xs font-bold" style={{ color: 'var(--gray-1)' }}>Categorias</span>
                    <button type="button"
                      onClick={() => { setEditingCat(null); setShowCatForm(true); }}
                      className="flex items-center gap-1 text-xs font-bold"
                      style={{ color: 'var(--red)' }}>
                      <Plus size={13} /> Nova
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: cat.color?.startsWith('#') ? cat.color : undefined }}
                            data-color={cat.color} />
                          <span className="text-sm font-medium" style={{ color: 'var(--white)' }}>{cat.name}</span>
                          {cat.isDefault && <span className="text-[10px]" style={{ color: 'var(--gray-3)' }}>padrão</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => { setEditingCat(cat); setShowCatForm(true); }}
                            style={{ color: 'var(--gray-2)' }}><Pencil size={13} /></button>
                          {!cat.isDefault && (
                            <button type="button" onClick={() => deleteDebtCategory(cat.id)}
                              style={{ color: 'var(--gray-3)' }}><Trash2 size={13} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {categories.length === 0 ? (
                <p className="text-sm py-2" style={{ color: 'var(--gray-2)' }}>
                  Nenhuma categoria. Clique em "Gerenciar" para criar.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const active = effectiveCategoryId === cat.id.toString();
                    return (
                      <button key={cat.id} type="button"
                        onClick={() => handleChange('categoryId', cat.id.toString())}
                        className="py-2.5 px-2 rounded-xl text-xs font-bold truncate transition-all"
                        style={active
                          ? { background: 'var(--red)', color: '#fff', border: '2px solid var(--red)', transform: 'scale(1.03)' }
                          : { background: 'var(--card-2)', color: 'var(--gray-1)', border: '2px solid var(--border)' }
                        }>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recorrência */}
            <div>
              <label style={labelStyle}>Recorrência</label>
              <div className="grid grid-cols-3 gap-2">
                {RECURRENCE_OPTIONS.map(opt => {
                  const active = form.recurrence === opt.id;
                  return (
                    <button key={opt.id} type="button"
                      onClick={() => handleChange('recurrence', opt.id)}
                      className="py-2.5 px-3 rounded-xl text-sm font-bold transition-all"
                      style={active
                        ? { background: 'var(--red)', color: '#fff', border: '2px solid var(--red)' }
                        : { background: 'var(--card-2)', color: 'var(--gray-1)', border: '2px solid var(--border)' }
                      }>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parcelas */}
            {form.recurrence === 'parcelada' && (
              <div className="animate-fade-in">
                <label style={labelStyle}>Número de Parcelas</label>
                <input type="number" inputMode="numeric" min="2" max="120"
                  value={form.installments}
                  onChange={e => handleChange('installments', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-base font-mono"
                  style={inputStyle} />
                <p className="text-xs mt-1.5" style={{ color: 'var(--gray-2)' }}>
                  Valor por parcela: R$ {form.amount ? (parseFloat(form.amount) / parseInt(form.installments || 1)).toFixed(2) : '0,00'}
                </p>
              </div>
            )}

            {/* Salvar */}
            {errors.submit && (
              <p className="text-sm font-semibold text-center py-2 rounded-xl"
                style={{ background: 'rgba(229,0,0,0.1)', color: '#e50000' }}>
                {errors.submit}
              </p>
            )}
            <button type="submit" disabled={saving}
              className="w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: saving ? '#2a2a2a' : '#e50000',
                color: saving ? '#555' : '#fff',
              }}>
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
                : <>{isEditing ? <Save size={20} /> : <Plus size={20} />}{isEditing ? 'Salvar alterações' : 'Adicionar Dívida'}</>
              }
            </button>
          </form>
        </div>
      </div>

      {showCatForm && (
        <DebtCategoryForm
          onClose={() => { setShowCatForm(false); setEditingCat(null); }}
          category={editingCat}
        />
      )}
    </>
  );
}
