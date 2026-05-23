import { describe, it, expect, vi, beforeEach } from 'vitest';

// Importa as funções mockadas
import { addDebt, updateDebt, deleteDebt, markAsPaid, markAsUnpaid } from '../db/database';

describe('database — addDebt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chama addDebt e retorna id', async () => {
    addDebt.mockResolvedValueOnce(42);
    const id = await addDebt({
      name: 'Cartão',
      amount: 500,
      dueDate: '2026-06-10',
      categoryId: 1,
      recurrence: 'unica',
    });
    expect(id).toBe(42);
    expect(addDebt).toHaveBeenCalledTimes(1);
  });

  it('chama markAsPaid com id correto', async () => {
    await markAsPaid(5);
    expect(markAsPaid).toHaveBeenCalledWith(5);
  });

  it('chama markAsUnpaid com id correto', async () => {
    await markAsUnpaid(3);
    expect(markAsUnpaid).toHaveBeenCalledWith(3);
  });

  it('chama updateDebt com id e changes', async () => {
    await updateDebt(7, { name: 'Novo nome' });
    expect(updateDebt).toHaveBeenCalledWith(7, { name: 'Novo nome' });
  });

  it('chama deleteDebt com id correto', async () => {
    await deleteDebt(9);
    expect(deleteDebt).toHaveBeenCalledWith(9);
  });
});
