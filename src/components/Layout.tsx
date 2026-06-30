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
  ShoppingCart,
  Target,
  Box,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logoDark from '@/assets/kora-sidebar-branca.png.asset.json';
import logoLight from '@/assets/kora-login.png.asset.json';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM', href: '/crm', icon: Kanban },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Serviços', href: '/servicos', icon: Package },
  { name: 'Produtos', href: '/produtos', icon: Box },
  { name: 'Caixa', href: '/caixa', icon: Wallet },
  { name: 'Saídas', href: '/saidas', icon: TrendingDown },
  { name: 'Planejamento e Metas', href: '/faturamento', icon: Target },
  { name: 'Compras', href: '/orcamentos', icon: ShoppingCart },
  { name: 'Configuração', href: '/configuracao', icon: Settings },
];

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
  const { signOut, user } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, collapsed ? '1' : '0');
    } catch {}
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
            {navigation.map((item) => {
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
                © 2025 Kora
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
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold ml-2 lg:ml-0">
              {navigation.find(n => n.href === location.pathname)?.name || 
               (location.pathname.startsWith('/projetos') ? 'Projetos' : 'Dashboard')}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

    </div>
  );
}
