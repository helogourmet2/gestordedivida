// ─── Supabase Client ──────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function isConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Credenciais não configuradas.');
    return false;
  }
  return true;
}

// ─── Token FCM ────────────────────────────────────────────────────────────────
export async function saveFCMToken(token, userId) {
  if (!isConfigured()) return;
  const uid = userId ?? 'anonymous';

  try {
    // Primeiro tenta atualizar o registro existente pelo token
    const resPatch = await fetch(
      `${SUPABASE_URL}/rest/v1/fcm_tokens?token=eq.${encodeURIComponent(token)}`,
      {
        method: 'PATCH',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify({ user_id: uid, updated_at: new Date().toISOString() }),
      }
    );

    // Se não existia (nenhuma linha atualizada), insere
    if (resPatch.status === 404 || resPatch.headers.get('content-range') === '*/0') {
      const resInsert = await fetch(`${SUPABASE_URL}/rest/v1/fcm_tokens`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          user_id: uid,
          token,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!resInsert.ok) throw new Error(await resInsert.text());
    }

    console.log('[Supabase] Token FCM salvo:', uid);
  } catch (err) {
    console.error('[Supabase] Erro ao salvar token FCM:', err);
  }
}

// ─── Sync de dívida individual (upsert) ──────────────────────────────────────
export async function syncDebt(debt, userId) {
  if (!isConfigured() || !userId || debt.id == null) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/debts`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        local_id: debt.id,
        user_id: userId,
        name: debt.name,
        amount: debt.amount,
        due_date: debt.dueDate ? debt.dueDate.split('T')[0] : null,
        is_paid: debt.isPaid ?? false,
        paid_at: debt.paidAt ?? null,
        recurrence: debt.recurrence ?? null,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      // 409 com merge-duplicates = já existe e foi atualizado, não é erro real
      if (res.status !== 409) throw new Error(txt);
    }
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar dívida:', err);
  }
}

// ─── Deletar dívida ───────────────────────────────────────────────────────────
export async function deleteDebtSync(localId, userId) {
  if (!isConfigured() || !userId) return;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/debts?local_id=eq.${localId}&user_id=eq.${encodeURIComponent(userId)}`,
      { method: 'DELETE', headers: headers() }
    );
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error('[Supabase] Erro ao deletar dívida:', err);
  }
}

// ─── Sync em lote (primeiro login) ───────────────────────────────────────────
export async function syncAllDebts(debts, userId) {
  if (!isConfigured() || !userId || !debts.length) return;

  const rows = debts
    .filter(d => d.id != null)
    .map(d => ({
      local_id: d.id,
      user_id: userId,
      name: d.name,
      amount: d.amount,
      due_date: d.dueDate ? d.dueDate.split('T')[0] : null,
      is_paid: d.isPaid ?? false,
      paid_at: d.paidAt ?? null,
      recurrence: d.recurrence ?? null,
      updated_at: new Date().toISOString(),
    }));

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/debts`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`[Supabase] ${rows.length} dívidas sincronizadas`);
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar dívidas em lote:', err);
  }
}
