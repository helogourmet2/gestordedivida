import { beforeEach, expect, it, vi } from 'vitest';

vi.unmock('../db/database');
vi.mock('dexie', () => {
  class Table {
    rows = [];
    async toArray() { return structuredClone(this.rows); }
    async add(row) {
      const id = Math.max(0, ...this.rows.map(item => item.id)) + 1;
      this.rows.push({ ...structuredClone(row), id });
      return id;
    }
    async update(id, changes) {
      const row = this.rows.find(item => item.id === id);
      if (!row) throw new Error(`Missing category ${id}`);
      Object.assign(row, structuredClone(changes));
    }
    async delete(id) { this.rows = this.rows.filter(row => row.id !== id); }
    where(field) {
      return { equals: value => ({ modify: async changes => {
        this.rows.filter(row => row[field] === value).forEach(row => Object.assign(row, changes));
      } }) };
    }
  }
  return { default: class {
    debtCategories = new Table();
    transactionCategories = new Table();
    debts = new Table();
    transactions = new Table();
    version() { return { stores: () => ({ upgrade() {} }) }; }
    async transaction(...args) { return args.at(-1)(); }
  } };
});

import { db, mergeRemoteDebtCategories, mergeRemoteDebts, mergeRemoteTransactionCategories } from '../db/database';

beforeEach(() => {
  for (const table of [db.debtCategories, db.transactionCategories, db.debts, db.transactions]) table.rows = [];
});

it('imports repeated cloud categories once and keeps every cloud ID linked to debts', async () => {
  const categories = ['a', 'b', 'c', 'd'].map(syncId => ({ syncId, name: 'Cartão' }));
  await mergeRemoteDebtCategories(categories);
  await mergeRemoteDebtCategories(categories);
  expect(await db.debtCategories.toArray()).toHaveLength(1);
  await mergeRemoteDebts(categories.map((category, index) => ({
    syncId: `debt-${index}`, categorySyncId: category.syncId, name: 'Compra', amount: 10,
  })));
  expect((await db.debts.toArray()).every(debt => debt.categoryId === 1)).toBe(true);
});

it('repairs existing duplicates and preserves debts linked to each copy', async () => {
  db.debtCategories.rows = [
    { id: 1, name: 'Cartão', syncId: 'original' },
    { id: 2, name: ' CARTÃO ', syncId: 'duplicate' },
  ];
  db.debts.rows = [{ id: 1, categoryId: 2, amount: 100 }];
  await mergeRemoteDebtCategories([]);
  expect(await db.debtCategories.toArray()).toHaveLength(1);
  expect(db.debts.rows[0]).toEqual({ id: 1, categoryId: 1, amount: 100 });
  expect(db.debtCategories.rows[0].syncAliases).toContain('duplicate');
});

it('keeps income and expense categories with the same name separate', async () => {
  await mergeRemoteTransactionCategories([
    { name: 'Extra', type: 'receita', syncId: 'income' },
    { name: 'Extra', type: 'despesa', syncId: 'expense' },
    { name: 'Extra', type: 'despesa', syncId: 'expense-copy' },
  ]);
  expect(await db.transactionCategories.toArray()).toHaveLength(2);
});
