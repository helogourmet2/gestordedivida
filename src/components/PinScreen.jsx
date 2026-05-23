import { useState } from 'react';
import { Delete } from 'lucide-react';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinScreen({ onSuccess, onCancel, title = 'Digite seu PIN' }) {
  const [digits, setDigits] = useState([]);
  const [shake, setShake] = useState(false);

  const handleKey = (key) => {
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
      return;
    }
    if (key === '') return;

    const next = [...digits, key];
    setDigits(next);

    if (next.length === 4) {
      const ok = onSuccess(next.join(''));
      if (!ok) {
        setShake(true);
        setTimeout(() => {
          setDigits([]);
          setShake(false);
        }, 600);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center px-6 py-6">
      <div className="w-full max-w-xs flex flex-col items-center gap-5">
        {/* Ícone */}
        <img
          src="/icons/icon-512.png"
          alt="Gestor de Dívidas"
          className="w-16 h-16 rounded-2xl shadow-xl shadow-red-900/30"
        />

        <div className="text-center">
          <p className="text-white font-semibold text-base">{title}</p>
          <p className="text-[#6b8ab8] text-xs mt-1">Insira seu PIN de 4 dígitos</p>
        </div>

        {/* Indicadores de dígitos */}
        <div className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                digits.length > i
                  ? 'bg-red-500 border-red-500 scale-110'
                  : 'bg-transparent border-[#3a5278]'
              }`}
            />
          ))}
        </div>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={key === ''}
              className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                key === ''
                  ? 'invisible'
                  : key === '⌫'
                  ? 'bg-[#152a55] text-[#6b8ab8] hover:bg-[#1e3a6e] flex items-center justify-center'
                  : 'bg-[#152a55] text-white hover:bg-[#1e3a6e]'
              }`}
            >
              {key === '⌫' ? <Delete size={20} /> : key}
            </button>
          ))}
        </div>

        {/* Cancelar */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[#6b8ab8] text-sm hover:text-white transition-colors mt-1"
          >
            Cancelar
          </button>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
