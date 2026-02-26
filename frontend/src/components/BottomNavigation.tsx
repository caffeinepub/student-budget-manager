import { useRouter, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, Receipt, Target, TrendingUp, Calculator } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/invest', label: 'Invest', icon: TrendingUp },
  { path: '/calculator', label: 'Calc', icon: Calculator },
];

export default function BottomNavigation() {
  const router = useRouter();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = currentPath === path;
          return (
            <button
              key={path}
              onClick={() => router.navigate({ to: path })}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl touch-target transition-all duration-200 min-w-[56px] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
