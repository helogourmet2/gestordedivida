import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, List, ArrowLeftRight, Sparkles, Settings } from 'lucide-react';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Início' },
  { to: '/calendario', icon: Calendar,         label: 'Calendário' },
  { to: '/dividas',    icon: List,             label: 'Dívidas' },
  { to: '/financas',   icon: ArrowLeftRight,   label: 'Finanças' },
  { to: '/assistente', icon: Sparkles,         label: 'IA' },
  { to: '/config',     icon: Settings,         label: 'Config' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'var(--black)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all duration-150 relative"
          >
            {({ isActive }) => (
              <>
                {/* Indicador ativo */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--red)' }}
                  />
                )}
                <div
                  className="p-1.5 rounded-xl transition-all duration-150"
                  style={isActive ? { background: 'var(--red-dim)' } : {}}
                >
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? 'var(--red)' : 'var(--gray-2)' }}
                  />
                </div>
                <span
                  className="text-[11px] font-semibold leading-none"
                  style={{ color: isActive ? 'var(--red)' : 'var(--gray-2)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
