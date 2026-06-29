import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricCard } from '@/components/MetricCard';
import { PriceHistorySection } from '@/components/PriceHistorySection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Exchange rates (BRL base)
export const EXCHANGE_RATES = {
  BRL: 1,
  USD: 5.38,
  EUR: 6.27,
};

export type Currency = 'BRL' | 'USD' | 'EUR';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
};

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
  currency: Currency;
}

export function Servicos() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    currency: 'BRL' as Currency,
  });

  const formatCurrencyValue = (value: number, currency: Currency = 'BRL') => {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCurrencyBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Convert price to BRL
  const convertToBRL = (price: number, currency: Currency): number => {
    return price * EXCHANGE_RATES[currency];
  };

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
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
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || formData.price <= 0 || !user) {
      toast.error('Preencha o nome e o preço do serviço');
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name.trim(),
            price: formData.price,
            description: formData.description.trim() || null,
            currency: formData.currency,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('Serviço atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            name: formData.name.trim(),
            price: formData.price,
            description: formData.description.trim() || null,
            currency: formData.currency,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Serviço criado com sucesso');
      }

      setIsDialogOpen(false);
      setEditingService(null);
      setFormData({ name: '', price: 0, description: '', currency: 'BRL' });
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      description: service.description || '',
      currency: service.currency,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      toast.success('Serviço excluído com sucesso');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
    }
  };

  const openNewDialog = () => {
    setEditingService(null);
    setFormData({ name: '', price: 0, description: '', currency: 'BRL' });
    setIsDialogOpen(true);
  };

  const totalServices = services.length;
  // Calculate average price in BRL for consistency
  const averagePriceInBRL = services.length > 0 
    ? services.reduce((a, b) => a + convertToBRL(Number(b.price), b.currency), 0) / services.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="Total de Serviços"
          value={totalServices}
          subtitle="Serviços cadastrados"
          icon={<Package className="h-5 w-5 text-foreground" />}
        />
        <MetricCard
          title="Preço Médio (em R$)"
          value={formatCurrencyBRL(averagePriceInBRL)}
          subtitle="Média convertida para Real"
          icon={<Package className="h-5 w-5 text-foreground" />}
        />
      </div>

      {/* Header */}
      <div className="flex justify-end">
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Services List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Descrição</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Preço Original</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Valor em R$</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const priceInBRL = convertToBRL(Number(service.price), service.currency);
                return (
                  <tr
                    key={service.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors animate-fade-in"
                  >
                    <td className="p-4 font-medium">{service.name}</td>
                    <td className="p-4 text-muted-foreground">
                      {service.description || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-foreground">
                        {formatCurrencyValue(Number(service.price), service.currency)}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({service.currency})
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-foreground">
                      {formatCurrencyBRL(priceInBRL)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum serviço cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New/Edit Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Nome do Serviço</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Gestão de Redes Sociais"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Preço</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Moeda</label>
                <Select
                  value={formData.currency}
                  onValueChange={(value: Currency) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="USD">Dólar ($) - 1 USD = R$ {EXCHANGE_RATES.USD.toFixed(2)}</SelectItem>
                    <SelectItem value="EUR">Euro (€) - 1 EUR = R$ {EXCHANGE_RATES.EUR.toFixed(2)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.currency !== 'BRL' && formData.price > 0 && (
              <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                <span className="text-muted-foreground">Valor convertido: </span>
                <span className="font-semibold text-foreground">
                  {formatCurrencyBRL(convertToBRL(formData.price, formData.currency))}
                </span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do serviço"
                className="mt-1"
              />
            </div>
            {editingService && (
              <PriceHistorySection
                entity="service"
                entityId={editingService.id}
                currentPrice={formData.price}
                currency={formData.currency}
                onPriceSaved={async ({ price }) => {
                  if (price == null) return;
                  setFormData(prev => ({ ...prev, price }));
                  const { error } = await supabase
                    .from('services')
                    .update({ price, currency: formData.currency })
                    .eq('id', editingService.id);
                  if (error) {
                    console.error(error);
                    toast.error('Erro ao atualizar preço atual');
                  } else {
                    fetchServices();
                  }
                }}
              />
            )}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {editingService ? 'Salvar' : 'Criar'}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Servicos;
