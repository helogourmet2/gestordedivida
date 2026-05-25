import { useState } from 'react';
import { Bell, BellOff, Trash2, Download, ChevronRight, Info, Smartphone, Lock, LockOpen, X, Delete, FlaskConical, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { requestFCMToken, auth } from '../lib/firebase';
import { db } from '../db/database';
import { usePin } from '../hooks/usePin';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

const SERVICE_ROLE_KEY = null; // não expor no frontend — o teste usa a Edge Function diretamente

// ─── Mini teclado PIN inline ──────────────────────────────────────────────────
const PIN_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

function PinInput({ title, onComplete, onCancel }) {
  const [digits, setDigits] = useState([]);
  const [shake, setShake] = useState(false);

  const handleKey = (key) => {
    if (key === '⌫') { setDigits(d => d.slice(0, -1)); return; }
    if (key === '') return;
    const next = [...digits, key];
    setDigits(next);
    if (next.length === 4) {
      const ok = onComplete(next.join(''));
      if (ok === false) {
        setShake(true);
        setTimeout(() => { setDigits([]); setShake(false); }, 600);
      }
      // Se ok !== false, o pai vai mudar o `pinModal` → componente remonta com key diferente → digits reseta
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#0f1f3d] rounded-3xl w-full max-w-xs p-4 flex flex-col gap-3">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold text-sm">{title}</p>
          <button onClick={onCancel} className="text-neutral-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Indicadores */}
        <div className={`flex justify-center gap-4 py-1 ${shake ? 'animate-shake' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all ${
              digits.length > i ? 'bg-red-500 border-red-500' : 'bg-transparent border-[#3a5278]'
            }`} />
          ))}
        </div>

        {/* Teclado */}
        <div className="grid grid-cols-3 gap-2">
          {PIN_KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={key === ''}
              className={`h-11 rounded-xl text-base font-semibold transition-all active:scale-95 ${
                key === '' ? 'invisible'
                : key === '⌫' ? 'bg-[#1e3a6e] text-[#6b8ab8] flex items-center justify-center'
                : 'bg-[#1e3a6e] text-white hover:bg-[#2a4d8a]'
              }`}
            >
              {key === '⌫' ? <Delete size={16} /> : key}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}

// ─── Debug de Notificações ────────────────────────────────────────────────────
function NotificationDebug() {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]);

  const addStep = (label, status, detail = '') => {
    setSteps(s => [...s, { label, status, detail, ts: Date.now() }]);
  };

  const runTest = async () => {
    setRunning(true);
    setSteps([]);

    // 1. Permissão de notificação
    const perm = Notification.permission;
    if (perm !== 'granted') {
      addStep('Permissão de notificação', 'error', `Status: "${perm}" — vá em Configurações do site e permita notificações`);
      setRunning(false);
      return;
    }
    addStep('Permissão de notificação', 'ok', 'granted');

    // 2. Usuário logado
    const user = auth?.currentUser;
    if (!user) {
      addStep('Usuário autenticado', 'error', 'Nenhum usuário logado');
      setRunning(false);
      return;
    }
    addStep('Usuário autenticado', 'ok', `uid: ${user.uid.substring(0, 12)}...`);

    // 3. Token FCM local
    const localToken = localStorage.getItem('fcm_token');
    if (!localToken) {
      addStep('Token FCM local', 'warn', 'Não encontrado — tente reativar as notificações');
    } else {
      addStep('Token FCM local', 'ok', localToken.substring(0, 20) + '...');
    }

    // 4. Token salvo no Supabase
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/fcm_tokens?user_id=eq.${encodeURIComponent(user.uid)}&select=user_id,updated_at`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      if (!data?.length) {
        addStep('Token no Supabase', 'error', 'Não encontrado — reative as notificações em Configurações');
      } else {
        addStep('Token no Supabase', 'ok', `Salvo em: ${new Date(data[0].updated_at).toLocaleString('pt-BR')}`);
      }
    } catch (e) {
      addStep('Token no Supabase', 'error', String(e));
    }

    // 5. Dívidas sincronizadas
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/debts?user_id=eq.${encodeURIComponent(user.uid)}&select=name,due_date,is_paid&order=due_date.asc&limit=3`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const data = await res.json();
      if (!data?.length) {
        addStep('Dívidas no Supabase', 'warn', 'Nenhuma dívida sincronizada — cadastre uma dívida');
      } else {
        addStep('Dívidas no Supabase', 'ok', `${data.length} dívida(s): ${data.map(d => d.name).join(', ')}`);
      }
    } catch (e) {
      addStep('Dívidas no Supabase', 'error', String(e));
    }

    // 6. Disparar notificação local imediata
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification('🧪 Teste de notificação', {
          body: 'Notificações funcionando! O push com app fechado depende dos passos acima.',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'debug-test',
          vibrate: [200, 100, 200],
        });
      } else {
        new Notification('🧪 Teste de notificação', {
          body: 'Notificações funcionando!',
          icon: '/icons/icon-192.png',
        });
      }
      addStep('Notificação local', 'ok', 'Disparada — você deve ter visto o alerta agora');
    } catch (e) {
      addStep('Notificação local', 'error', String(e));
    }

    // 7. Resumo final
    const hasToken = !!localStorage.getItem('fcm_token');
    if (!hasToken) {
      addStep('Próximo passo', 'warn', 'Clique em "Ativar notificações" acima para registrar o token FCM. O push automático às 8h só funciona após isso.');
    } else {
      addStep('Push automático (8h BRT)', 'ok', 'Tudo configurado — o pg_cron vai disparar diariamente');
    }

    setRunning(false);
  };

  const icons = {
    ok: <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />,
    error: <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />,
    warn: <AlertCircle size={15} className="text-yellow-500 shrink-0 mt-0.5" />,
    loading: <Loader size={15} className="text-blue-400 shrink-0 mt-0.5 animate-spin" />,
  };

  return (
    <section>
      <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">
        Debug de Notificações
      </h3>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <button
          onClick={runTest}
          disabled={running}
          className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <FlaskConical size={18} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {running ? 'Testando...' : 'Testar notificações'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Diagnóstico completo passo a passo
              </p>
            </div>
          </div>
          {running
            ? <Loader size={18} className="text-neutral-400 animate-spin" />
            : <ChevronRight size={18} className="text-neutral-400" />
          }
        </button>

        {/* Resultado dos steps */}
        {steps.length > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 p-4 space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                {icons[step.status]}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{step.label}</p>
                  {step.detail && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 break-all">{step.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Config principal ─────────────────────────────────────────────────────────
export default function Config() {
  const { notificationsEnabled, requestPermission } = useNotifications();
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  // PIN
  const { pinEnabled, setPin, removePin, verifyPin } = usePin();
  const [pinModal, setPinModal] = useState(null); // null | 'set-new' | 'confirm-new' | 'disable'
  const [pendingPin, setPendingPin] = useState('');

  const handleEnableNotifications = async () => {
    await requestPermission();
    await requestFCMToken();
  };

  const handleClearAll = async () => {
    if (!window.confirm('Tem certeza? Isso vai apagar TODAS as dívidas permanentemente.')) return;
    setClearing(true);
    try {
      await db.debts.clear();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setClearing(false);
    }
  };

  const handleExport = async () => {
    try {
      const debts = await db.debts.toArray();
      const json = JSON.stringify(debts, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dividas-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Fluxo de ativar PIN ──
  const handleTogglePin = () => {
    if (pinEnabled) {
      setPinModal('disable');
    } else {
      setPinModal('set-new');
    }
  };

  const handlePinComplete = (digits) => {
    if (pinModal === 'set-new') {
      setPendingPin(digits);
      setPinModal('confirm-new');
      return true;
    }
    if (pinModal === 'confirm-new') {
      if (digits === pendingPin) {
        setPin(digits);
        setPinModal(null);
        setPendingPin('');
        return true;
      }
      return false; // PINs não batem → shake
    }
    if (pinModal === 'disable') {
      if (verifyPin(digits)) {
        removePin();
        setPinModal(null);
        return true;
      }
      return false; // PIN errado → shake
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        Configurações
      </h2>

      {/* Segurança */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">
          Segurança
        </h3>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <button
            onClick={handleTogglePin}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                pinEnabled ? 'bg-red-100 dark:bg-red-950' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}>
                {pinEnabled
                  ? <Lock size={18} className="text-red-600 dark:text-red-400" />
                  : <LockOpen size={18} className="text-neutral-500" />
                }
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {pinEnabled ? 'PIN ativo' : 'Ativar PIN de acesso'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {pinEnabled
                    ? 'Toque para desativar o PIN'
                    : 'Proteja o app com um PIN de 4 dígitos'}
                </p>
              </div>
            </div>
            {/* Toggle visual */}
            <div className={`w-11 h-6 rounded-full transition-colors relative ${pinEnabled ? 'bg-red-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pinEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>
      </section>

      {/* Notificações */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">
          Notificações
        </h3>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <button
            onClick={handleEnableNotifications}
            disabled={notificationsEnabled}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                notificationsEnabled ? 'bg-red-100 dark:bg-red-950' : 'bg-neutral-100 dark:bg-neutral-800'
              }`}>
                {notificationsEnabled
                  ? <Bell size={18} className="text-red-600 dark:text-red-400" />
                  : <BellOff size={18} className="text-neutral-500" />
                }
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {notificationsEnabled ? 'Notificações ativas' : 'Ativar notificações'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {notificationsEnabled ? 'Você receberá alertas de vencimento' : 'Receba alertas de dívidas vencendo'}
                </p>
              </div>
            </div>
            {!notificationsEnabled && <ChevronRight size={18} className="text-neutral-400" />}
          </button>
        </div>
      </section>

      {/* Dados */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">
          Dados
        </h3>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Download size={18} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Exportar dados</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Baixar backup em JSON</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-400" />
          </button>

          <button
            onClick={handleClearAll}
            disabled={clearing}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {cleared ? 'Dados apagados!' : clearing ? 'Apagando...' : 'Apagar todos os dados'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Ação irreversível</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-400" />
          </button>
        </div>
      </section>

      {/* Instalar PWA */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">
          Aplicativo
        </h3>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Smartphone size={18} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Instalar no celular</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                No navegador, toque em "Adicionar à tela inicial"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Debug notificações */}
      <NotificationDebug />

      {/* Sobre */}
      <section>
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-start gap-3">
          <Info size={16} className="text-neutral-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Gestor de Dívidas v1.0</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Dados ficam no dispositivo e sincronizam com a nuvem quando você entra na conta. Funciona offline.
            </p>
          </div>
        </div>
      </section>

      {/* Modal PIN */}
      {pinModal && (
        <PinInput
          key={pinModal}
          title={
            pinModal === 'set-new' ? 'Defina um PIN de 4 dígitos' :
            pinModal === 'confirm-new' ? 'Confirme o PIN' :
            'Digite o PIN atual para desativar'
          }
          onComplete={handlePinComplete}
          onCancel={() => { setPinModal(null); setPendingPin(''); }}
        />
      )}
    </div>
  );
}
