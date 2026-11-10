import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ReceivableForm from '../components/ReceivableForm';
import AReceber from '../pages/AReceber';

const state = vi.hoisted(() => ({ categories: [], allTransactions: [], addTransaction: vi.fn(), updateTransaction: vi.fn(), deleteTransactionCategory: vi.fn(), deleteTransaction: vi.fn(), markTransactionAsPaid: vi.fn(), markTransactionAsUnpaid: vi.fn() }));
vi.mock('../hooks/useTransactions', () => ({ useTransactions: () => state }));

beforeEach(() => {
  cleanup(); vi.clearAllMocks();
  state.categories = [
    { id: 1, name: 'Empréstimo', type: 'receita', syncId: 'receivable-category-emprestimo', isDefault: true },
    { id: 2, name: 'Vendas', type: 'receita', syncId: 'receivable-category-vendas', isDefault: true },
    { id: 3, name: 'Salário', type: 'receita', syncId: 'old-salary' },
  ];
  state.allTransactions = [];
});

it('creates a pending receivable and offers only receivable categories', async () => {
  const close = vi.fn(); render(<ReceivableForm onClose={close} />);
  expect(screen.queryByText('Salário')).toBeNull();
  fireEvent.change(screen.getByLabelText('Descrição / quem deve'), { target: { value: 'João' } });
  fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '120' } });
  fireEvent.click(screen.getByText('Adicionar dívida a receber'));
  await waitFor(() => expect(state.addTransaction).toHaveBeenCalledWith(expect.objectContaining({ description: 'João', amount: 120, type: 'receita', isPaid: false, categoryId: 1 })));
  expect(close).toHaveBeenCalled();
});

it('splits installments exactly and handles the end of a month', async () => {
  render(<ReceivableForm onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Descrição / quem deve'), { target: { value: 'Venda' } });
  fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('Data de vencimento'), { target: { value: '2027-01-31' } });
  fireEvent.change(screen.getByLabelText('Recorrência'), { target: { value: 'parcelada' } });
  fireEvent.change(screen.getByLabelText('Número de parcelas'), { target: { value: '3' } });
  fireEvent.click(screen.getByText('Adicionar dívida a receber'));
  await waitFor(() => expect(state.addTransaction).toHaveBeenCalledTimes(3));
  const items = state.addTransaction.mock.calls.map(([item]) => item);
  expect(items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0)).toBe(10000);
  expect(items.map(item => item.date.slice(0, 10))).toEqual(['2027-01-31', '2027-02-28', '2027-03-31']);
});

it('keeps old finance entries out of receivable totals and exposes history', () => {
  state.allTransactions = [
    { id: 1, categoryId: 1, type: 'receita', description: 'João', amount: 100, date: '2020-01-01', isPaid: false },
    { id: 2, categoryId: 3, type: 'receita', description: 'Salário antigo', amount: 5000, date: '2020-01-01', isPaid: true },
  ];
  render(<AReceber />);
  expect(screen.getByText('João')).toBeInTheDocument();
  expect(screen.queryByText('Salário antigo')).toBeNull();
  expect(screen.getByText('Ver histórico de Finanças (1)')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Recebidas'));
  expect(screen.queryByText('João')).toBeNull();
  fireEvent.click(screen.getByText('Vencidas'));
  expect(screen.getByText('João')).toBeInTheDocument();
});
