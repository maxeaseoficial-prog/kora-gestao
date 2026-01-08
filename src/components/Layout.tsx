import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Wallet, 
  FileText, 
  Menu,
  X,
  Download,
  LogOut,
  Brain,
  Package,
  ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM', href: '/crm', icon: Kanban },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Serviços', href: '/servicos', icon: Package },
  { name: 'Caixa', href: '/caixa', icon: Wallet },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Roteiros', href: '/roteiros', icon: ScrollText },
  { name: 'Mapas Mentais', href: '/mapas-mentais', icon: Brain },
  { name: 'Instalar', href: '/install', icon: Download },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

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
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">MAXEASE</span>
            </div>
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              © 2025 MAXEASE
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
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
              {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* PWA Install Button */}
      <PWAInstallButton />
    </div>
  );
}
