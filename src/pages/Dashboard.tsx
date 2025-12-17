import { DollarSign, Users, TrendingUp, Kanban } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { MetricCard } from '@/components/MetricCard';

export function Dashboard() {
  const { clients, finances, crmCards, crmColumns } = useApp();

  const activeClients = clients.filter(c => c.status === 'ativo').length;
  const monthlyRevenue = finances.reduce((acc, f) => acc + f.value, 0);
  const totalCards = crmCards.length;

  const recentEntries = finances
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(monthlyRevenue)}
          icon={<DollarSign className="h-5 w-5 text-foreground" />}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Clientes Ativos"
          value={activeClients}
          subtitle="Total de clientes ativos"
          icon={<Users className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Leads no CRM"
          value={totalCards}
          subtitle={`Em ${crmColumns.length} colunas`}
          icon={<Kanban className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(monthlyRevenue / (recentEntries.length || 1))}
          icon={<TrendingUp className="h-5 w-5 text-foreground" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Entries */}
        <div className="bg-card rounded-xl border border-border animate-slide-up">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Entradas Recentes</h2>
          </div>
          <div className="p-4">
            {recentEntries.length > 0 ? (
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{entry.clientName}</p>
                      <p className="text-sm text-muted-foreground">{entry.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(entry.value)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma entrada registrada
              </p>
            )}
          </div>
        </div>

        {/* CRM Status */}
        <div className="bg-card rounded-xl border border-border animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Status do CRM</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {crmColumns.map((column) => {
                const cardsInColumn = crmCards.filter(c => c.columnId === column.id).length;
                const percentage = totalCards > 0 ? (cardsInColumn / totalCards) * 100 : 0;
                
                return (
                  <div key={column.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{column.title}</span>
                      <span className="text-muted-foreground">{cardsInColumn} cards</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active Clients Summary */}
      <div className="bg-card rounded-xl border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Clientes Ativos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Empresa</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Serviço</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor Mensal</th>
              </tr>
            </thead>
            <tbody>
              {clients.filter(c => c.status === 'ativo').map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="p-4 font-medium">{client.name}</td>
                  <td className="p-4 text-muted-foreground">{client.company}</td>
                  <td className="p-4 text-muted-foreground">{client.serviceType}</td>
                  <td className="p-4 text-right font-semibold">{formatCurrency(client.monthlyValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
