import { useState } from 'react';
import { DollarSign, Users, TrendingUp, Kanban, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { MetricCard } from '@/components/MetricCard';
import { Button } from '@/components/ui/button';
import { MonthYearPicker } from '@/components/MonthYearPicker';

function Dashboard() {
  const { clients, finances, crmCards, crmColumns, hideNumbers, setHideNumbers } = useApp();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const activeClientsList = clients.filter(c => c.status === 'ativo');
  const activeClients = activeClientsList.length;
  const currentRecurrence = activeClientsList.reduce((acc, c) => acc + c.monthlyValue, 0);
  const totalCards = crmCards.length;

  // Filter finances by selected month/year
  const filteredFinances = finances.filter((f) => {
    const date = new Date(f.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const monthlyRevenue = filteredFinances.reduce((acc, f) => acc + f.value, 0);

  const recentEntries = filteredFinances
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    if (hideNumbers) return '•••••••';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (hideNumbers) return '••';
    return value.toString();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <MonthYearPicker
          month={selectedMonth}
          year={selectedYear}
          onChange={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHideNumbers(!hideNumbers)}
          className="gap-2"
        >
          {hideNumbers ? (
            <>
              <Eye className="h-4 w-4" />
              Mostrar Valores
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              Ocultar Valores
            </>
          )}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Faturamento Total do Mês"
          value={formatCurrency(monthlyRevenue + currentRecurrence)}
          subtitle="Receita + Recorrência"
          icon={<DollarSign className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Receita do Mês"
          value={formatCurrency(monthlyRevenue)}
          icon={<DollarSign className="h-5 w-5 text-foreground" />}
          trend={hideNumbers ? undefined : { value: 12, isPositive: true }}
        />
        <MetricCard
          title="Recorrência Atual"
          value={formatCurrency(currentRecurrence)}
          subtitle={hideNumbers ? '•••••••' : `${activeClients} contratos ativos`}
          icon={<TrendingUp className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Clientes Ativos"
          value={formatNumber(activeClients)}
          subtitle="Total de clientes ativos"
          icon={<Users className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Leads no CRM"
          value={formatNumber(totalCards)}
          subtitle={hideNumbers ? '•••••••' : `Em ${crmColumns.length} colunas`}
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
            <h2 className="text-lg font-semibold">Entradas do Mês</h2>
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
                Nenhuma entrada neste mês
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
                      <span className="text-muted-foreground">{hideNumbers ? '••' : cardsInColumn} cards</span>
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

export default Dashboard;
