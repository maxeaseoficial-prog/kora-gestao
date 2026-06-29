import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { History, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

type Entity = 'product' | 'service';

interface PriceEntry {
  id: string;
  effective_date: string;
  sale_price?: number;
  cost_price?: number;
  price?: number;
  currency?: string;
  note?: string | null;
}

interface Props {
  entity: Entity;
  entityId: string;
  currentSalePrice?: number;
  currentCostPrice?: number;
  currentPrice?: number;
  currency?: string;
  /** Called after a new price is saved with the updated current values, so parent can sync the main row. */
  onPriceSaved: (updates: { salePrice?: number; costPrice?: number; price?: number }) => Promise<void> | void;
}

const fmtBRL = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

export function PriceHistorySection({
  entity, entityId, currentSalePrice = 0, currentCostPrice = 0, currentPrice = 0, currency = 'BRL', onPriceSaved,
}: Props) {
  const { user } = useAuth();
  const table = entity === 'product' ? 'product_price_history' : 'service_price_history';
  const fkColumn = entity === 'product' ? 'product_id' : 'service_id';

  const [history, setHistory] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newSalePrice, setNewSalePrice] = useState<number>(currentSalePrice);
  const [newCostPrice, setNewCostPrice] = useState<number>(currentCostPrice);
  const [newPrice, setNewPrice] = useState<number>(currentPrice);
  const [effectiveDate, setEffectiveDate] = useState<string>(today());
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!entityId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*')
        .eq(fkColumn, entityId)
        .order('effective_date', { ascending: false });
      if (error) {
        console.error(error);
        toast.error('Erro ao carregar histórico de preços');
      } else {
        setHistory((data || []) as PriceEntry[]);
      }
      setLoading(false);
    })();
  }, [entityId, table, fkColumn]);

  const handleSave = async () => {
    if (!user) return;
    if (!effectiveDate) { toast.error('Informe a data de vigência'); return; }
    if (entity === 'product') {
      if (newSalePrice <= 0) { toast.error('Informe o preço de venda'); return; }
    } else {
      if (newPrice <= 0) { toast.error('Informe o preço'); return; }
    }

    try {
      setSaving(true);
      const payload: any = {
        user_id: user.id,
        [fkColumn]: entityId,
        effective_date: effectiveDate,
        note: note.trim() || null,
      };
      if (entity === 'product') {
        payload.sale_price = newSalePrice;
        payload.cost_price = newCostPrice;
      } else {
        payload.price = newPrice;
        payload.currency = currency;
      }
      const { data, error } = await (supabase as any).from(table).insert(payload).select().single();
      if (error) throw error;
      setHistory(prev => [data as PriceEntry, ...prev].sort((a, b) => b.effective_date.localeCompare(a.effective_date)));

      // If new effective date is today or earlier, it becomes the active price.
      if (effectiveDate <= today()) {
        if (entity === 'product') {
          await onPriceSaved({ salePrice: newSalePrice, costPrice: newCostPrice });
        } else {
          await onPriceSaved({ price: newPrice });
        }
      }
      toast.success('Novo preço registrado');
      setNote('');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar novo preço');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta entrada do histórico? Isso não altera lançamentos passados.')) return;
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) { toast.error('Erro ao remover'); return; }
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const todayStr = today();
  const activeEntryId = history.find(h => h.effective_date <= todayStr)?.id;

  return (
    <div className="rounded-md border border-border bg-secondary/30">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <History className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Histórico de preços</h4>
        <span className="text-xs text-muted-foreground ml-auto">
          Lançamentos anteriores permanecem inalterados
        </span>
      </div>

      {/* New price form */}
      <div className="p-4 space-y-3 border-b border-border">
        {entity === 'product' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Novo preço de custo</Label>
              <Input
                type="number" step="0.01" min="0"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Novo preço de venda</Label>
              <Input
                type="number" step="0.01" min="0"
                value={newSalePrice}
                onChange={(e) => setNewSalePrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs">Novo preço ({currency})</Label>
            <Input
              type="number" step="0.01" min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Começa a valer em</Label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observação (opcional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Reajuste anual"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Salvar novo preço
        </Button>
      </div>

      {/* History list */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Carregando...</div>
        ) : history.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Sem histórico ainda. Use o formulário acima para registrar o primeiro reajuste.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {history.map(h => {
              const isFuture = h.effective_date > todayStr;
              const isActive = h.id === activeEntryId;
              return (
                <li key={h.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {entity === 'product'
                          ? `${fmtBRL(Number(h.sale_price || 0))} venda`
                          : `${h.currency || 'BRL'} ${Number(h.price || 0).toFixed(2)}`}
                      </span>
                      {entity === 'product' && (
                        <span className="text-xs text-muted-foreground">
                          · custo {fmtBRL(Number(h.cost_price || 0))}
                        </span>
                      )}
                      {isActive && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Check className="h-3 w-3" /> Vigente
                        </Badge>
                      )}
                      {isFuture && (
                        <Badge variant="outline" className="text-[10px]">Agendado</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      A partir de {fmtDate(h.effective_date)}
                      {h.note && ` · ${h.note}`}
                    </p>
                  </div>
                  <Button
                    size="icon" variant="ghost"
                    className={cn("h-7 w-7 text-muted-foreground hover:text-destructive")}
                    onClick={() => handleDelete(h.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}