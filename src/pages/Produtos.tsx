import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Package, Search, Pencil, Trash2, DollarSign, TrendingUp, Boxes, Sparkles, ImagePlus, X, Loader2 } from 'lucide-react';
import { useProducts, type ProductInput, type Product } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: ProductInput = {
  name: '',
  description: '',
  costPrice: 0,
  salePrice: 0,
  productType: 'fisico',
  isActive: true,
  registrationDate: today(),
  imageUrl: '',
};

export default function Produtos() {
  const { products, loading, addProduct, updateProduct, toggleActive, deleteProduct } = useProducts();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'fisico' | 'digital' | 'active' | 'inactive'>('all');

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'fisico' && p.productType !== 'fisico') return false;
      if (filter === 'digital' && p.productType !== 'digital') return false;
      if (filter === 'active' && !p.isActive) return false;
      if (filter === 'inactive' && p.isActive) return false;
      return true;
    });
  }, [products, search, filter]);

  const stats = useMemo(() => {
    const active = products.filter(p => p.isActive).length;
    const inactive = products.length - active;
    const avgMargin = products.length
      ? products.reduce((s, p) => s + (p.salePrice - p.costPrice), 0) / products.length
      : 0;
    return { total: products.length, active, inactive, avgMargin };
  }, [products]);

  const openNew = () => { setEditing(null); setForm({ ...emptyForm, registrationDate: today() }); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || '', costPrice: p.costPrice, salePrice: p.salePrice,
      productType: p.productType, isActive: p.isActive, registrationDate: p.registrationDate,
      imageUrl: p.imageUrl || '',
    });
    setOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem maior que 5MB'); return; }
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm(f => ({ ...f, imageUrl: data.publicUrl }));
    } catch (e) {
      console.error(e); toast.error('Erro ao enviar imagem');
    } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    if (editing) await updateProduct(editing.id, form);
    else await addProduct(form);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Produtos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de produtos físicos e digitais
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      {/* Stats bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Boxes className="h-4 w-4" />} label="Total" value={stats.total.toString()} />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="Ativos" value={stats.active.toString()} accent />
        <StatCard icon={<Package className="h-4 w-4" />} label="Inativos" value={stats.inactive.toString()} muted />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Margem média" value={fmtBRL(stats.avgMargin)} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              ['all', 'Todos'],
              ['active', 'Ativos'],
              ['inactive', 'Inativos'],
              ['fisico', 'Físicos'],
              ['digital', 'Digitais'],
            ] as const).map(([k, l]) => (
              <Button
                key={k}
                variant={filter === k ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(k)}
              >
                {l}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
            <Button onClick={openNew} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Cadastrar primeiro produto</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const margin = p.salePrice - p.costPrice;
            const marginPct = p.costPrice > 0 ? (margin / p.costPrice) * 100 : 0;
            return (
              <Card key={p.id} className={cn(
                'group transition-all hover:border-foreground/30',
                !p.isActive && 'opacity-60'
              )}>
                <CardContent className="p-0 overflow-hidden">
                  {p.imageUrl ? (
                    <div className="aspect-video bg-secondary overflow-hidden border-b border-border">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-secondary/50 border-b border-border flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{p.name}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {p.productType === 'fisico' ? 'Físico' : 'Digital'}
                        </Badge>
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={p.isActive}
                      onCheckedChange={(v) => toggleActive(p.id, v)}
                      aria-label="Ativar/desativar produto"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    <Stat label="Custo" value={fmtBRL(p.costPrice)} />
                    <Stat label="Venda" value={fmtBRL(p.salePrice)} />
                    <Stat label="Margem" value={`${marginPct.toFixed(0)}%`} positive={margin >= 0} />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-muted-foreground">
                      Cadastrado em {new Date(p.registrationDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O produto "{p.name}" será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProduct(p.id)}>Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Imagem do produto</Label>
              {form.imageUrl ? (
                <div className="relative group/img rounded-md overflow-hidden border border-border aspect-video bg-secondary">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button" size="icon" variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover/img:opacity-100 transition-opacity"
                    onClick={() => setForm({ ...form, imageUrl: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 aspect-video rounded-md border border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/60 hover:border-foreground/30 transition-colors",
                  uploading && "pointer-events-none opacity-60"
                )}>
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {uploading ? 'Enviando...' : 'Clique para enviar uma imagem (PNG, JPG até 5MB)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />
                </label>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço de custo</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preço de venda</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.productType}
                  onValueChange={(v: 'fisico' | 'digital') => setForm({ ...form, productType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisico">Físico</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Data de cadastro</Label>
                <Input
                  type="date"
                  value={form.registrationDate}
                  onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Produto ativo</p>
                <p className="text-xs text-muted-foreground">Inativos não aparecem em vendas/orçamentos</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit}>{editing ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, accent, muted }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <Card className={cn(accent && 'border-foreground/30')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={cn('text-muted-foreground', accent && 'text-foreground', muted && 'opacity-50')}>{icon}</span>
        </div>
        <p className="text-2xl font-semibold mt-2" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-semibold', positive === false && 'text-destructive')}>{value}</p>
    </div>
  );
}