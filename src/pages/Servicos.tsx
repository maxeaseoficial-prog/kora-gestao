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
import { MetricCard } from '@/components/MetricCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
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
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
      setServices(data || []);
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
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Serviço criado com sucesso');
      }

      setIsDialogOpen(false);
      setEditingService(null);
      setFormData({ name: '', price: 0, description: '' });
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
    setFormData({ name: '', price: 0, description: '' });
    setIsDialogOpen(true);
  };

  const totalServices = services.length;
  const averagePrice = services.length > 0 
    ? services.reduce((a, b) => a + Number(b.price), 0) / services.length 
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
          title="Preço Médio"
          value={formatCurrency(averagePrice)}
          subtitle="Média dos serviços"
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
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Preço</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors animate-fade-in"
                >
                  <td className="p-4 font-medium">{service.name}</td>
                  <td className="p-4 text-muted-foreground">
                    {service.description || '-'}
                  </td>
                  <td className="p-4 text-right font-semibold text-foreground">
                    {formatCurrency(Number(service.price))}
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
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
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
        <DialogContent>
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
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do serviço"
                className="mt-1"
              />
            </div>
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
