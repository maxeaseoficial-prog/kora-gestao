import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Power, PowerOff, CalendarIcon, Building2, User as UserIcon, Filter as FilterIcon, X, Upload, Loader2, MessageSquare, Instagram } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ClientType = 'empresa' | 'pessoa';

type FormState = Omit<Client, 'id' | 'createdAt'>;

const buildInitialState = (clientType: ClientType): FormState => ({
  clientType,
  name: '',
  company: '',
  serviceType: '',
  recurrence: 'mensal',
  monthlyValue: 0,
  contractDay: 1,
  status: 'ativo',
  email: '',
  phone: '',
  secondaryPhone: '',
  gender: '',
  age: null,
  entryDate: new Date(),
  deactivatedAt: null,
  endDate: null,
  avatarPath: null,
  avatarUrl: null,
  originType: '',
  originChannel: null,
  referrerName: null,
  instagram: null,
});

const SALES_CHANNELS = [
  'Prospecção',
  'Presencial',
  'WhatsApp',
  'Instagram',
  'Tráfego pago',
  'YouTube',
  'Facebook',
  'LinkedIn',
];

function Clientes() {
  const { clients, setClients, finances, setFinances } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [genderFilter, setGenderFilter] = useState<string>('todos');
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');
  const [entryFrom, setEntryFrom] = useState<Date | undefined>(undefined);
  const [entryTo, setEntryTo] = useState<Date | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<FormState>(buildInitialState('empresa'));
  const [formErrors, setFormErrors] = useState<{ name?: boolean; company?: boolean }>({});
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);
  const [savingNewService, setSavingNewService] = useState(false);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .order('name');
    if (!error) setServices((data as any) || []);
  };

  useEffect(() => {
    if (user) fetchServices();
  }, [user]);

  const handleCreateService = async () => {
    if (!newServiceName.trim() || !user) {
      toast.error('Informe o nome do serviço');
      return;
    }
    setSavingNewService(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: newServiceName.trim(),
          price: newServicePrice || 0,
          currency: 'BRL',
          user_id: user.id,
        })
        .select('id, name')
        .single();
      if (error) throw error;
      await fetchServices();
      setFormData((prev) => ({ ...prev, serviceType: data!.name }));
      toast.success('Serviço cadastrado');
      setIsNewServiceOpen(false);
      setNewServiceName('');
      setNewServicePrice(0);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cadastrar serviço');
    } finally {
      setSavingNewService(false);
    }
  };

  useEffect(() => {
    const prefill = (location.state as any)?.prefillClient;
    if (!prefill) return;
    const type: ClientType = prefill.clientType === 'pessoa' ? 'pessoa' : 'empresa';
    setEditingClient(null);
    setFormData({
      ...buildInitialState(type),
      name: prefill.name || '',
      company: prefill.company || '',
      serviceType: prefill.serviceType || '',
      email: prefill.email || '',
      phone: prefill.phone || '',
    });
    setIsDialogOpen(true);
    // limpa o state para não reabrir ao navegar
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || client.status === statusFilter;
    const matchesType = typeFilter === 'todos' || (client.clientType || 'empresa') === typeFilter;
    const matchesGender = genderFilter === 'todos' || (client.gender || '') === genderFilter;
    const ageNum = client.age ?? null;
    const minN = ageMin === '' ? null : Number(ageMin);
    const maxN = ageMax === '' ? null : Number(ageMax);
    const matchesAge =
      (minN === null && maxN === null) ||
      (ageNum !== null && (minN === null || ageNum >= minN) && (maxN === null || ageNum <= maxN));
    const entryTime = client.entryDate ? new Date(client.entryDate).getTime() : 0;
    const matchesEntry =
      (!entryFrom || entryTime >= new Date(entryFrom.setHours(0, 0, 0, 0)).getTime()) &&
      (!entryTo || entryTime <= new Date(new Date(entryTo).setHours(23, 59, 59, 999)).getTime());
    return matchesSearch && matchesStatus && matchesType && matchesGender && matchesAge && matchesEntry;
  });

  const stats = useMemo(() => {
    const total = clients.length;
    const masculino = clients.filter((c) => c.gender === 'masculino').length;
    const feminino = clients.filter((c) => c.gender === 'feminino').length;
    return { total, masculino, feminino };
  }, [clients]);

  const activeFilterCount =
    (typeFilter !== 'todos' ? 1 : 0) +
    (genderFilter !== 'todos' ? 1 : 0) +
    (ageMin !== '' || ageMax !== '' ? 1 : 0) +
    (entryFrom || entryTo ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter('todos');
    setGenderFilter('todos');
    setAgeMin('');
    setAgeMax('');
    setEntryFrom(undefined);
    setEntryTo(undefined);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const openTypePicker = () => {
    setEditingClient(null);
    setIsTypePickerOpen(true);
  };

  const chooseClientType = (type: ClientType) => {
    setFormData(buildInitialState(type));
    setIsTypePickerOpen(false);
    setIsDialogOpen(true);
  };

  const openEditClientDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      clientType: client.clientType || 'empresa',
      name: client.name,
      company: client.company || '',
      serviceType: client.serviceType,
      recurrence: client.recurrence,
      monthlyValue: client.monthlyValue,
      contractDay: client.contractDay,
      status: client.status,
      email: client.email || '',
      phone: client.phone || '',
      secondaryPhone: client.secondaryPhone || '',
      gender: client.gender || '',
      age: client.age ?? null,
      entryDate: client.entryDate || new Date(),
      deactivatedAt: client.deactivatedAt || null,
      endDate: client.endDate || null,
      avatarPath: client.avatarPath || null,
      avatarUrl: client.avatarUrl || null,
      originType: client.originType || '',
      originChannel: client.originChannel || null,
      referrerName: client.referrerName || null,
      instagram: client.instagram || null,
    });
    setIsDialogOpen(true);
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?';

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB).');
      return;
    }
    try {
      setUploadingAvatar(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('client-avatars')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from('client-avatars')
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signErr) throw signErr;
      // Try to remove previous avatar if any
      if (formData.avatarPath) {
        await supabase.storage.from('client-avatars').remove([formData.avatarPath]);
      }
      setFormData((prev) => ({ ...prev, avatarPath: path, avatarUrl: signed?.signedUrl || null }));
      toast.success('Foto enviada');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (formData.avatarPath) {
      await supabase.storage.from('client-avatars').remove([formData.avatarPath]);
    }
    setFormData((prev) => ({ ...prev, avatarPath: null, avatarUrl: null }));
  };

  const handleSave = () => {
    const errors: { name?: boolean; company?: boolean } = {};
    if (!formData.name.trim()) errors.name = true;
    if (formData.clientType === 'empresa' && !(formData.company || '').trim()) errors.company = true;
    if (errors.name || errors.company) {
      setFormErrors(errors);
      toast.error('Preencha os campos obrigatórios destacados em vermelho.');
      return;
    }
    setFormErrors({});

    const payload: FormState = {
      ...formData,
      company: formData.clientType === 'empresa' ? formData.company : '',
      contractDay: formData.recurrence === 'mensal' ? formData.contractDay : 1,
    };

    if (editingClient) {
      setClients(clients.map(c => (c.id === editingClient.id ? { ...c, ...payload } : c)));
    } else {
      const newClient: Client = {
        id: crypto.randomUUID(),
        ...payload,
        createdAt: new Date(),
      };
      setClients([...clients, newClient]);

      // Se cliente pontual com valor, lança automaticamente no caixa
      if (payload.recurrence === 'pontual' && Number(payload.monthlyValue) > 0) {
        const newFinance = {
          id: crypto.randomUUID(),
          clientId: newClient.id,
          clientName: newClient.name,
          value: Number(payload.monthlyValue),
          date: payload.entryDate || new Date(),
          type: payload.serviceType || 'Serviço',
          description: payload.serviceType || '',
        };
        setFinances([...finances, newFinance]);
      }
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (clientId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setClients(clients.filter(c => c.id !== clientId));
    }
  };

  const handleToggleActive = (client: Client) => {
    if (client.status === 'ativo') {
      if (!confirm(`Desativar cliente "${client.name}"? Ele não contará no próximo mês.`)) return;
      setClients(clients.map(c =>
        c.id === client.id ? { ...c, status: 'inativo', deactivatedAt: new Date() } : c
      ));
    } else {
      setClients(clients.map(c =>
        c.id === client.id ? { ...c, status: 'ativo', deactivatedAt: null } : c
      ));
    }
  };

  const getStatusBadge = (status: Client['status']) => {
    const styles = {
      ativo: 'bg-foreground text-background',
      inativo: 'bg-muted text-muted-foreground',
      pendente: 'bg-secondary text-secondary-foreground border border-border',
    };
    const labels = { ativo: 'Ativo', inativo: 'Inativo', pendente: 'Pendente' };
    return (
      <span className={cn('px-2 py-1 rounded-md text-xs font-medium', styles[status])}>
        {labels[status]}
      </span>
    );
  };

  const isPessoa = formData.clientType === 'pessoa';
  const isMensal = formData.recurrence === 'mensal';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lista" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lista">Clientes</TabsTrigger>
          <TabsTrigger value="controle">Controle de cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de clientes</p>
          <p className="text-2xl font-semibold mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Masculino</p>
          <p className="text-2xl font-semibold mt-1">{stats.masculino}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Feminino</p>
          <p className="text-2xl font-semibold mt-1">{stats.feminino}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start gap-2">
                <FilterIcon className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-foreground text-background text-xs font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4" align="start">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="empresa">Empresas</SelectItem>
                    <SelectItem value="pessoa">Pessoas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sexo</label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Idade</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input type="number" min={0} placeholder="Mín" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
                  <Input type="number" min={0} placeholder="Máx" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data de entrada</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('justify-start text-left font-normal', !entryFrom && 'text-muted-foreground')}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {entryFrom ? format(entryFrom, 'dd/MM/yy', { locale: ptBR }) : 'De'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={entryFrom} onSelect={setEntryFrom} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('justify-start text-left font-normal', !entryTo && 'text-muted-foreground')}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {entryTo ? format(entryTo, 'dd/MM/yy', { locale: ptBR }) : 'Até'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={entryTo} onSelect={setEntryTo} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-3 w-3" /> Limpar
                </Button>
                <Button size="sm" onClick={() => setFiltersOpen(false)}>Aplicar</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openTypePicker}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Client List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Empresa</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Serviço</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Recorrência</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const type = client.clientType || 'empresa';
                return (
                  <tr
                    key={client.id}
                    onClick={() => openEditClientDialog(client)}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors animate-fade-in cursor-pointer',
                      client.status === 'inativo'
                        ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
                        : 'hover:bg-secondary/30'
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          {client.avatarUrl && <AvatarImage src={client.avatarUrl} alt={client.name} />}
                          <AvatarFallback className="text-xs font-medium bg-secondary">
                            {initials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{client.name}</p>
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border',
                              type === 'empresa' ? 'bg-secondary text-secondary-foreground border-border' : 'bg-muted text-muted-foreground border-border'
                            )}>
                              {type === 'empresa' ? <Building2 className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                              {type === 'empresa' ? 'Empresa' : 'Pessoa'}
                            </span>
                          </div>
                          {client.email && (
                          <p className={cn('text-sm', client.status === 'inativo' ? 'text-destructive/80' : 'text-muted-foreground')}>{client.email}</p>
                          )}
                          <p className={cn('text-xs mt-0.5', client.status === 'inativo' ? 'text-destructive/80' : 'text-muted-foreground')}>
                          Entrada: {format(new Date(client.entryDate), 'dd/MM/yyyy', { locale: ptBR })}
                          {client.endDate && (
                            <> · Encerrado em {format(new Date(client.endDate), 'dd/MM/yyyy', { locale: ptBR })}</>
                          )}
                          {client.status === 'inativo' && client.deactivatedAt && (
                            <> · Desativado: {format(new Date(client.deactivatedAt), 'dd/MM/yyyy', { locale: ptBR })}</>
                          )}
                        </p>
                        </div>
                      </div>
                    </td>
                    <td className={cn('p-4', client.status === 'inativo' ? '' : 'text-muted-foreground')}>
                      {client.company || '—'}
                    </td>
                    <td className={cn('p-4', client.status === 'inativo' ? '' : 'text-muted-foreground')}>{client.serviceType}</td>
                    <td className={cn('p-4 capitalize', client.status === 'inativo' ? '' : 'text-muted-foreground')}>{client.recurrence}</td>
                    <td className="p-4 text-right font-semibold">{formatCurrency(client.monthlyValue)}</td>
                    <td className="p-4 text-center">{getStatusBadge(client.status)}</td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={client.status === 'ativo' ? 'Desativar cliente' : 'Reativar cliente'}
                          onClick={() => handleToggleActive(client)}
                        >
                          {client.status === 'ativo' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditClientDialog(client)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="controle" className="space-y-6">
          <ControleClientes clients={clients} />
        </TabsContent>
      </Tabs>

      {/* Type picker dialog */}
      <Dialog open={isTypePickerOpen} onOpenChange={setIsTypePickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Qual tipo de cliente deseja cadastrar?</DialogTitle>
            <DialogDescription>
              Escolha entre Empresa ou Pessoa para abrir o formulário adequado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => chooseClientType('empresa')}
              className="group text-left rounded-xl border border-border bg-card hover:border-foreground hover:shadow-md transition-all p-6 flex flex-col gap-3"
            >
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold">🏢 Empresa</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastrar empresas que contratam serviços recorrentes ou pontuais.
                </p>
              </div>
              <span className="mt-2 inline-flex w-fit text-sm font-medium px-3 py-1.5 rounded-md bg-foreground text-background group-hover:opacity-90">
                Selecionar
              </span>
            </button>

            <button
              type="button"
              onClick={() => chooseClientType('pessoa')}
              className="group text-left rounded-xl border border-border bg-card hover:border-foreground hover:shadow-md transition-all p-6 flex flex-col gap-3"
            >
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold">👤 Pessoa</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastrar pessoas físicas que também podem contratar serviços recorrentes ou pontuais.
                </p>
              </div>
              <span className="mt-2 inline-flex w-fit text-sm font-medium px-3 py-1.5 rounded-md bg-foreground text-background group-hover:opacity-90">
                Selecionar
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setFormErrors({}); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient
                ? `Editar ${isPessoa ? 'Pessoa' : 'Empresa'}`
                : `Nova ${isPessoa ? 'Pessoa' : 'Empresa'}`}
            </DialogTitle>
            <DialogDescription>
              {isPessoa
                ? 'Cadastro de cliente individual (recorrente ou pontual).'
                : 'Cadastro de empresa (recorrente ou pontual).'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Foto */}
            <section className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border border-border">
                {formData.avatarUrl && <AvatarImage src={formData.avatarUrl} alt={formData.name || 'Cliente'} />}
                <AvatarFallback className="bg-secondary text-base font-medium">
                  {initials(formData.name || '?')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Foto do cliente</p>
                <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP até 5MB.</p>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {formData.avatarUrl ? 'Trocar foto' : 'Enviar foto'}
                  </Button>
                  {formData.avatarUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleAvatarRemove}>
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* Dados pessoais */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("text-sm font-medium", formErrors.name && "text-destructive")}>
                    {isPessoa ? 'Nome' : 'Nome do responsável'} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: false }));
                    }}
                    className={cn("mt-1", formErrors.name && "border-destructive focus-visible:ring-destructive")}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive mt-1">Este campo é obrigatório</p>
                  )}
                </div>
                {!isPessoa && (
                  <div>
                    <label className={cn("text-sm font-medium", formErrors.company && "text-destructive")}>
                      Nome da empresa <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.company || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, company: e.target.value });
                        if (formErrors.company) setFormErrors((p) => ({ ...p, company: false }));
                      }}
                      className={cn("mt-1", formErrors.company && "border-destructive focus-visible:ring-destructive")}
                    />
                    {formErrors.company && (
                      <p className="text-xs text-destructive mt-1">Este campo é obrigatório</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    Telefone principal
                    {formData.phone && (
                      <button
                        type="button"
                        onClick={() => window.open(`https://wa.me/${formData.phone.replace(/\D/g, '')}`, '_blank')}
                        className="text-muted-foreground hover:text-green-500 transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    Telefone secundário <span className="text-muted-foreground">(opcional)</span>
                    {formData.secondaryPhone && (
                      <button
                        type="button"
                        onClick={() => window.open(`https://wa.me/${formData.secondaryPhone.replace(/\D/g, '')}`, '_blank')}
                        className="text-muted-foreground hover:text-green-500 transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                  <Input
                    value={formData.secondaryPhone || ''}
                    onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    Instagram
                    {formData.instagram && (
                      <button
                        type="button"
                        onClick={() => {
                          const handle = formData.instagram!.replace('@', '');
                          window.open(`https://instagram.com/${handle}`, '_blank');
                        }}
                        className="text-muted-foreground hover:text-pink-500 transition-colors"
                        title="Abrir Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </button>
                    )}
                  </label>
                  <Input
                    value={formData.instagram || ''}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@usuario"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sexo</label>
                  <Select
                    value={formData.gender || ''}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as Client['gender'] })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isPessoa && (
                  <div>
                    <label className="text-sm font-medium">Idade</label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.age ?? ''}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Dados do contrato */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do contrato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo de serviço</label>
                  <Select
                    value={formData.serviceType || undefined}
                    onValueChange={(value) => {
                      if (value === '__new__') {
                        setIsNewServiceOpen(true);
                        return;
                      }
                      setFormData({ ...formData, serviceType: value });
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                      {formData.serviceType &&
                        !services.some((s) => s.name === formData.serviceType) && (
                          <SelectItem value={formData.serviceType}>
                            {formData.serviceType}
                          </SelectItem>
                        )}
                      <SelectItem value="__new__">+ Cadastrar novo serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Recorrência</label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value: 'mensal' | 'pontual') => setFormData({ ...formData, recurrence: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="pontual">Pontual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="number"
                    value={formData.monthlyValue === 0 ? '' : formData.monthlyValue}
                    onChange={(e) => setFormData({ ...formData, monthlyValue: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                {isMensal && (
                  <div>
                    <label className="text-sm font-medium">Dia do contrato</label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={formData.contractDay === 0 ? '' : formData.contractDay}
                      onChange={(e) => setFormData({ ...formData, contractDay: parseInt(e.target.value) || 1 })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Origem */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Origem do cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Como chegou</label>
                  <Select
                    value={formData.originType || ''}
                    onValueChange={(value: 'canal_vendas' | 'indicacao') =>
                      setFormData({
                        ...formData,
                        originType: value,
                        originChannel: value === 'canal_vendas' ? formData.originChannel : null,
                        referrerName: value === 'indicacao' ? formData.referrerName : null,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canal_vendas">Canal de vendas</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.originType === 'canal_vendas' && (
                  <div>
                    <label className="text-sm font-medium">Canal de vendas</label>
                    <Select
                      value={formData.originChannel || ''}
                      onValueChange={(value) => setFormData({ ...formData, originChannel: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar canal" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALES_CHANNELS.map((ch) => (
                          <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.originType === 'indicacao' && (
                  <div>
                    <label className="text-sm font-medium">Indicado por</label>
                    <Input
                      value={formData.referrerName || ''}
                      onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                      placeholder="Nome de quem indicou"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Controle */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Controle</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data de entrada</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'mt-1 w-full justify-start text-left font-normal',
                          !formData.entryDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.entryDate
                          ? format(formData.entryDate, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.entryDate}
                        onSelect={(date) => date && setFormData({ ...formData, entryDate: date })}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Data de encerramento <span className="text-muted-foreground">(opcional)</span></label>
                  <div className="mt-1 flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'flex-1 justify-start text-left font-normal',
                            !formData.endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate
                            ? format(formData.endDate, 'dd/MM/yyyy', { locale: ptBR })
                            : 'Selecionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.endDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, endDate: date || null })}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                    {formData.endDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setFormData({ ...formData, endDate: null })}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                {!isPessoa && (
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'ativo' | 'inativo' | 'pendente') =>
                        setFormData({
                          ...formData,
                          status: value,
                          deactivatedAt: value === 'inativo' ? (formData.deactivatedAt || new Date()) : null,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!isPessoa && formData.status === 'inativo' && (
                  <div>
                    <label className="text-sm font-medium">Data de desativação</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'mt-1 w-full justify-start text-left font-normal',
                            !formData.deactivatedAt && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.deactivatedAt
                            ? format(formData.deactivatedAt, 'dd/MM/yyyy', { locale: ptBR })
                            : 'Selecionar'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.deactivatedAt || undefined}
                          onSelect={(date) => setFormData({ ...formData, deactivatedAt: date || null })}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </section>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                {editingClient ? 'Salvar' : `Criar ${isPessoa ? 'Pessoa' : 'Empresa'}`}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewServiceOpen} onOpenChange={setIsNewServiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar novo serviço</DialogTitle>
            <DialogDescription>
              O serviço ficará disponível também na aba de Serviços.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do serviço</label>
              <Input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preço (R$)</label>
              <Input
                type="number"
                value={newServicePrice === 0 ? '' : newServicePrice}
                onChange={(e) => setNewServicePrice(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsNewServiceOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateService} disabled={savingNewService}>
                {savingNewService ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Clientes;

// ===== Controle de cliente (analytics) =====
const GRAY_PALETTE = [
  'hsl(0 0% 10%)',
  'hsl(0 0% 25%)',
  'hsl(0 0% 38%)',
  'hsl(0 0% 50%)',
  'hsl(0 0% 60%)',
  'hsl(0 0% 70%)',
  'hsl(0 0% 78%)',
  'hsl(0 0% 85%)',
  'hsl(0 0% 90%)',
];

function ControleClientes({ clients }: { clients: Client[] }) {
  const monthlyEntries = useMemoEntries(clients);
  const { channelData, originSplit, topChannel, totalIndicacoes, topIndicador, notInformed } =
    useMemoOrigins(clients);

  const totalEntradas = clients.length;
  const last12Total = monthlyEntries.reduce((s, m) => s + m.count, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total de clientes" value={String(totalEntradas)} />
        <KpiCard label="Entradas (12 meses)" value={String(last12Total)} />
        <KpiCard
          label="Canal que mais traz"
          value={topChannel ? topChannel.name : '—'}
          hint={topChannel ? `${topChannel.value} cliente${topChannel.value > 1 ? 's' : ''}` : 'Sem dados'}
        />
        <KpiCard
          label="Indicações"
          value={String(totalIndicacoes)}
          hint={topIndicador ? `Top: ${topIndicador.name} (${topIndicador.value})` : 'Sem indicações'}
        />
      </div>

      {/* Entradas mensais */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Entradas de clientes</h3>
            <p className="text-xs text-muted-foreground">Novos clientes cadastrados por mês (últimos 12 meses)</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyEntries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <RTooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} cliente${v > 1 ? 's' : ''}`, 'Entradas']}
              />
              <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pizza por canal/indicação */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-base font-semibold">Origem dos clientes</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Distribuição por canal de vendas e indicações
          </p>
          {channelData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
              Cadastre a origem dos clientes para ver o gráfico
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={GRAY_PALETTE[i % GRAY_PALETTE.length]} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number, n: string) => [`${v} cliente${v > 1 ? 's' : ''}`, n]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tabela detalhada */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-base font-semibold">Detalhamento por canal</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Quantos clientes vieram de cada origem
          </p>
          <div className="space-y-2">
            {channelData.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de origem ainda.</p>
            )}
            {channelData.map((c, i) => {
              const pct = totalEntradas > 0 ? (c.value / totalEntradas) * 100 : 0;
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block"
                        style={{ background: GRAY_PALETTE[i % GRAY_PALETTE.length] }}
                      />
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {c.value} <span className="text-xs">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {notInformed > 0 && (
              <p className="text-xs text-muted-foreground pt-3 border-t border-border mt-3">
                {notInformed} cliente{notInformed > 1 ? 's' : ''} sem origem informada
              </p>
            )}
          </div>

          {/* Split canal x indicação */}
          {(originSplit.canal > 0 || originSplit.indicacao > 0) && (
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Canal de vendas</p>
                <p className="text-xl font-semibold mt-1">{originSplit.canal}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Indicações</p>
                <p className="text-xl font-semibold mt-1">{originSplit.indicacao}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1 truncate">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>}
    </div>
  );
}

function useMemoEntries(clients: Client[]) {
  return useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({
        key,
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        count: 0,
      });
    }
    clients.forEach((c) => {
      const d = c.entryDate ? new Date(c.entryDate) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) m.count += 1;
    });
    return months;
  }, [clients]);
}

function useMemoOrigins(clients: Client[]) {
  return useMemo(() => {
    const channelMap = new Map<string, number>();
    const indicadorMap = new Map<string, number>();
    let canal = 0;
    let indicacao = 0;
    let notInformed = 0;

    clients.forEach((c) => {
      if (c.originType === 'canal_vendas' && c.originChannel) {
        canal += 1;
        channelMap.set(c.originChannel, (channelMap.get(c.originChannel) || 0) + 1);
      } else if (c.originType === 'indicacao') {
        indicacao += 1;
        const name = (c.referrerName || 'Sem nome').trim() || 'Sem nome';
        indicadorMap.set(name, (indicadorMap.get(name) || 0) + 1);
      } else {
        notInformed += 1;
      }
    });

    const channelData = [
      ...Array.from(channelMap.entries()).map(([name, value]) => ({ name, value })),
      ...(indicacao > 0 ? [{ name: 'Indicação', value: indicacao }] : []),
    ].sort((a, b) => b.value - a.value);

    const topChannel = channelData[0] || null;
    const topIndicador =
      Array.from(indicadorMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)[0] || null;

    return {
      channelData,
      originSplit: { canal, indicacao },
      topChannel,
      totalIndicacoes: indicacao,
      topIndicador,
      notInformed,
    };
  }, [clients]);
}