import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

export function useDashboard() {
  const metrics = useLiveQuery(async () => {
    const allDebts = await db.debts.toArray();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const pending = allDebts.filter(d => !d.isPaid);
    const paid = allDebts.filter(d => d.isPaid);
    
    const totalPending = pending.reduce((sum, d) => sum + d.amount, 0);
    const totalPaid = paid.reduce((sum, d) => sum + d.amount, 0);
    
    const monthDebts = allDebts.filter(d => {
      const date = new Date(d.dueDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const monthPending = monthDebts
      .filter(d => !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0);

    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    // Dívidas vencidas
    const overdue = pending
      .filter(d => new Date(d.dueDate) < new Date(todayStr))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Próximas a vencer
    const upcoming = pending
      .filter(d => new Date(d.dueDate) >= new Date(todayStr))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Dívida mais urgente: vencidas primeiro, depois próximas
    const urgentDebt = overdue.length > 0 ? overdue[0] : (upcoming.length > 0 ? upcoming[0] : null);
    
    // Próximas 5 (combinando vencidas + próximas)
    const next5 = [...overdue, ...upcoming].slice(0, 5);

    return {
      totalPending,
      totalPaid,
      totalAll: totalPending + totalPaid,
      monthPending,
      monthTotal: monthDebts.reduce((sum, d) => sum + d.amount, 0),
      urgentDebt,
      upcoming: next5,
      overdueCount: overdue.length,
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }, []);

  return metrics || {
    totalPending: 0,
    totalPaid: 0,
    totalAll: 0,
    monthPending: 0,
    monthTotal: 0,
    urgentDebt: null,
    upcoming: [],
    overdueCount: 0,
    paidCount: 0,
    pendingCount: 0,
  };
}
