import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, List, Settings, ArrowLeftRight, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Início' },
  { to: '/calendario', icon: Calendar,         label: 'Calendário' },
  { to: '/dividas',    icon: List,             label: 'Dívidas' },
  { to: '/financas',   icon: ArrowLeftRight,   label: 'Finanças' },
  { to: '/assistente', icon: Sparkles,         label: 'IA' },
  { to: '/config',     icon: Settings,         label: 'Config' },
];

export default function BottomNav({ isDark }) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${
      isDark
        ? 'bg-[#0a1628]/95 border-[#1a3366]'
        : 'bg-white/95 border-neutral-200'
    }`}>
      <div className="max-w-lg mx-auto flex justify-around items-center h-20 px-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-red-500'
                  : isDark
                    ? 'text-[#6b93d6] hover:text-[#b8cef0]'
                    : 'text-neutral-400 hover:text-neutral-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? isDark ? 'bg-red-600/20' : 'bg-red-50'
                    : ''
                }`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[11px] font-semibold leading-none ${
                  isActive ? 'text-red-500' : ''
                }`}>
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
