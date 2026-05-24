import { PlusCircle } from 'lucide-react';

export default function EmptyState({
  title = 'Nenhuma dívida cadastrada',
  description = 'Toque no botão + para registrar sua primeira dívida e começar o controle.',
  icon: Icon = PlusCircle,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: 'var(--red-dim)', border: '1px solid rgba(229,0,0,0.2)' }}
      >
        <Icon size={36} style={{ color: 'var(--red)' }} />
      </div>
      <h3 className="text-lg font-black mb-2" style={{ color: 'var(--white)' }}>{title}</h3>
      <p className="text-sm leading-relaxed max-w-[260px]" style={{ color: 'var(--gray-2)' }}>
        {description}
      </p>
    </div>
  );
}
