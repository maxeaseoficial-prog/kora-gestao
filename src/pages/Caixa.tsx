import { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, Search, Trash2, Pencil } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { FinanceEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MetricCard } from '@/components/MetricCard';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EXCHANGE_RATES, Currency, CURRENCY_SYMBOLS } from '@/pages/Servicos';

interface Service {
  id: string;
  name: string;
  price: number;
  currency: Currency;
}

export function Caixa() {
  const { finances, setFinances, clients } = useApp();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    value: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'Mensalidade',
    description: '',
    serviceId: '',
  });

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, currency')
        .order('name');

      if (error) throw error;
      // Cast currency to Currency type
      const typedServices: Service[] = (data || []).map(s => ({
        ...s,
        currency: s.currency as Currency,
      }));
      setServices(typedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Convert price to BRL
  const convertToBRL = (price: number, currency: Currency): number => {
    return price * EXCHANGE_RATES[currency];
  };

  const formatCurrencyValue = (value: number, currency: Currency = 'BRL') => {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateInput: Date | string) => {
    // Parse date string as local time to avoid timezone issues
    let date: Date;
    if (typeof dateInput === 'string') {
      const [year, month, day] = dateInput.split('T')[0].split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = dateInput;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatDateForInput = (dateInput: Date | string) => {
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0];
    }
    const d = dateInput;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse date string as local time to avoid timezone offset
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // noon to avoid DST issues
  };

  // Filter finances by selected month/year
  const financesInPeriod = finances.filter((f) => {
    const date = new Date(f.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const monthlyTotal = financesInPeriod.reduce((acc, f) => acc + f.value, 0);
  const totalEntriesInPeriod = financesInPeriod.length;

  const filteredFinances = financesInPeriod
    .filter((f) => {
      const matchesSearch = f.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'todos' || f.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const uniqueTypes = Array.from(new Set(finances.map((f) => f.type)));

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setFormData({
      ...formData,
      clientId,
      clientName: client?.company || '',
    });
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      // Convert the service price to BRL before setting the value
      const priceInBRL = convertToBRL(Number(service.price), service.currency);
      setFormData({
        ...formData,
        serviceId,
        type: service.name,
        value: priceInBRL,
        description: `${service.name} (${formatCurrencyValue(Number(service.price), service.currency)})`,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      clientName: '',
      value: 0,
      date: new Date().toISOString().split('T')[0],
      type: 'Mensalidade',
      description: '',
      serviceId: '',
    });
    setEditingEntry(null);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: FinanceEntry) => {
    setEditingEntry(entry);
    setFormData({
      clientId: entry.clientId,
      clientName: entry.clientName,
      value: entry.value,
      date: formatDateForInput(entry.date),
      type: entry.type,
      description: entry.description || '',
      serviceId: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.clientName.trim() || formData.value <= 0) return;

    if (editingEntry) {
      // Update existing entry
      const updatedEntry: FinanceEntry = {
        ...editingEntry,
        clientId: formData.clientId,
        clientName: formData.clientName,
        value: formData.value,
        date: parseLocalDate(formData.date),
        type: formData.type,
        description: formData.description,
      };

      setFinances(finances.map((f) => (f.id === editingEntry.id ? updatedEntry : f)));
    } else {
      // Create new entry
      const newEntry: FinanceEntry = {
        id: crypto.randomUUID(),
        clientId: formData.clientId,
        clientName: formData.clientName,
        value: formData.value,
        date: parseLocalDate(formData.date),
        type: formData.type,
        description: formData.description,
      };

      setFinances([...finances, newEntry]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (entryId: string) => {
    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
      setFinances(finances.filter((f) => f.id !== entryId));
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  return (
    <div className="space-y-6">
      {/* Month/Year Picker */}
      <div className="flex justify-start">
        <MonthYearPicker
          month={selectedMonth}
          year={selectedYear}
          onChange={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
        />
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total do Mês"
          value={formatCurrency(monthlyTotal)}
          subtitle="Receitas deste mês"
          icon={<TrendingUp className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Entradas do Mês"
          value={totalEntriesInPeriod}
          subtitle="Registros no período"
          icon={<Calendar className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Média por Entrada"
          value={formatCurrency(totalEntriesInPeriod > 0 ? monthlyTotal / totalEntriesInPeriod : 0)}
          subtitle="Valor médio recebido"
          icon={<TrendingUp className="h-5 w-5 text-foreground" />}
        />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrada
        </Button>
      </div>

      {/* Finance List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFinances.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors animate-fade-in"
                >
                  <td className="p-4 font-medium">{entry.clientName}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-secondary rounded-md text-xs font-medium">
                      {entry.type}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {entry.description || '-'}
                  </td>
                  <td className="p-4 text-muted-foreground">{formatDate(entry.date)}</td>
                  <td className="p-4 text-right font-semibold text-foreground">
                    {formatCurrency(entry.value)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFinances.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhuma entrada encontrada neste período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Editar Lançamento' : 'Nova Entrada'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <Select value={formData.clientId} onValueChange={handleClientChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Ou digite o nome</label>
              <Input
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Nome do cliente"
                className="mt-1"
              />
            </div>

            {/* Service Selection */}
            {services.length > 0 && (
              <div>
                <label className="text-sm font-medium">Serviço (converte automaticamente para R$)</label>
                <Select value={formData.serviceId} onValueChange={handleServiceChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => {
                      const priceInBRL = convertToBRL(Number(service.price), service.currency);
                      const showConversion = service.currency !== 'BRL';
                      return (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - {formatCurrencyValue(Number(service.price), service.currency)}
                          {showConversion && ` → ${formatCurrency(priceInBRL)}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor</label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Receita</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                  <SelectItem value="Projeto">Projeto</SelectItem>
                  <SelectItem value="Consultoria">Consultoria</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da entrada"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {editingEntry ? 'Salvar Alterações' : 'Registrar'}
              </Button>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Caixa;
