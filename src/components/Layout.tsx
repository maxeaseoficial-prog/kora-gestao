import { ReactNode, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Wallet, 
  Menu,
  X,
  LogOut,
  Brain,
  Package,
  CalendarDays,
  Target,
  Box,
  ChevronLeft,
  ChevronRight,
  Settings,
  ShieldCheck
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logoDark from '@/assets/kora-sidebar-branca-v3.png.asset.json';
import logoLight from '@/assets/kora-sidebar-preta-v3.png.asset.json';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'CRM', href: '/crm', icon: Kanban },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Serviços', href: '/servicos', icon: Package },
  { name: 'Produtos', href: '/produtos', icon: Box },
  { name: 'Caixa', href: '/caixa', icon: Wallet },
  { name: 'Planejamento e Metas', href: '/faturamento', icon: Target },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Configuração', href: '/configuracao', icon: Settings },
];

const adminNavigationItem = { name: 'Admin', href: '/admin', icon: ShieldCheck };

const STORAGE_KEY_COLLAPSED = 'maxease-sidebar-collapsed';

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_COLLAPSED) === '1';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const { signOut, user, isAdmin } = useAuth();
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) { setTrialEndsAt(null); return; }
    // Read-only: trial dates come from the database, never from local storage.
    void supabase
      .from('user_trials')
      .select('trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setTrialEndsAt((data?.trial_ends_at as string) ?? null);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const trialDaysRemaining = (() => {
    if (!trialEndsAt) return null;
    const ms = new Date(trialEndsAt).getTime() - Date.now();
    if (ms <= 0) return null;
    return Math.max(1, Math.ceil(ms / 86400000));
  })();
  const visibleNavigation = isAdmin ? [...navigation, adminNavigationItem] : navigation;

  const greetingName = (() => {
    try {
      if (user?.id) {
        const raw = localStorage.getItem(`maxease-profile:${user.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          const n = (parsed?.name || '').trim();
          if (n) return n.split(/\s+/)[0];
        }
      }
    } catch {
      // A profile stored locally is optional presentation data.
    }
    const email = user?.email || '';
    const localPart = email.split('@')[0] || '';
    if (!localPart) return '';
    const first = localPart.split(/[._-]/)[0] || localPart;
    return first.charAt(0).toUpperCase() + first.slice(1);
  })();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, collapsed ? '1' : '0');
    } catch {
      // Sidebar persistence is best-effort only.
    }
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-card border-r border-border transform transition-all duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "flex items-center justify-between h-16 border-b border-border",
            collapsed ? "px-2" : "px-6"
          )}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <img src={logoLight.url} alt="Kora" className="h-12 w-auto block dark:hidden" />
                <img src={logoDark.url} alt="Kora" className="h-12 w-auto hidden dark:block" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {visibleNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    collapsed && "justify-center",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-2 text-muted-foreground hover:text-foreground",
                collapsed ? "justify-center px-0" : "justify-start"
              )}
              onClick={() => signOut()}
              title={collapsed ? 'Sair' : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && 'Sair'}
            </Button>
            {!collapsed && (
              <p className="text-xs text-muted-foreground text-center">
                © 2026 Kora
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("transition-all duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-background/80 backdrop-blur-sm border-b border-border lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center">
            {location.pathname === '/dashboard' && greetingName ? (
              <h1 className="ml-2 lg:ml-0 text-xl md:text-2xl font-light tracking-tight text-foreground font-sans">
                Olá, <span className="font-bold">{greetingName}</span>
              </h1>
            ) : (
              <h1 className="text-lg font-semibold ml-2 lg:ml-0">
                {visibleNavigation.find(n => n.href === location.pathname)?.name ||
                 (location.pathname.startsWith('/projetos') ? 'Projetos' : 'Dashboard')}
              </h1>
            )}
          </div>
          {trialDaysRemaining !== null && (
            <span
              className={cn(
                'hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                trialDaysRemaining <= 2
                  ? 'border-foreground/40 bg-foreground/10 text-foreground'
                  : 'border-border text-muted-foreground'
              )}
              title={`Teste grátis até ${new Date(trialEndsAt as string).toLocaleDateString('pt-BR')}`}
            >
              Teste grátis — {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

    </div>
  );
}
