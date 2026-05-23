import { useState } from 'react';
import { Bell, BellOff, Trash2, Download, ChevronRight, Info, Smartphone } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { requestFCMToken } from '../lib/firebase';
import { db } from '../db/database';

export default function Config() {
  const { notificationsEnabled, requestPermission } = useNotifications();
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleEnableNotifications = async () => {
    // Solicita permissão local + obtém token FCM e salva no Supabase
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

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        Configurações
      </h2>

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
                notificationsEnabled
                  ? 'bg-red-100 dark:bg-red-950'
                  : 'bg-neutral-100 dark:bg-neutral-800'
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
                  {notificationsEnabled
                    ? 'Você receberá alertas de vencimento'
                    : 'Receba alertas de dívidas vencendo'}
                </p>
              </div>
            </div>
            {!notificationsEnabled && (
              <ChevronRight size={18} className="text-neutral-400" />
            )}
          </button>
        </div>
      </section>

      {/* Dados */}
      <section>
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 px-1">
          Dados
        </h3>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Exportar */}
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

          {/* Limpar tudo */}
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

      {/* Sobre */}
      <section>
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-start gap-3">
          <Info size={16} className="text-neutral-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Gestor de Dívidas v1.0</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Dados armazenados localmente no seu dispositivo. Funciona offline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
