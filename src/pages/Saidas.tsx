import { useMemo, useRef, useState } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  FileText,
  X,
  Loader2,
  Receipt,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useExpenses, Expense, ExpenseCategory, ExpenseInput } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CATEGORIES: ExpenseCategory[] = ['Pagamento', 'Investimento', 'Fornecedor', 'Outros'];

const categoryStyle: Record<ExpenseCategory, string> = {
  Pagamento: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  Investimento: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  Fornecedor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  Outros: 'bg-white/5 text-white/70 border-white/10',
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm: ExpenseInput = {
  category: 'Pagamento',
  description: '',
  value: 0,
  entryDate: todayStr(),
  paymentDate: null,
  receiptUrl: null,
};

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(d: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function Saidas() {
  const { user } = useAuth();
  const { expenses, createExpense, updateExpense, deleteExpense } = useExpenses();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseInput>(emptyForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ExpenseCategory>('all');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = e.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = filter === 'all' || e.category === filter;
      return matchSearch && matchCat;
    });
  }, [expenses, search, filter]);

  const totals = useMemo(() => {
    const total = expenses.reduce((a, e) => a + e.value, 0);
    const now = new Date();
    const monthTotal = expenses
      .filter((e) => {
        const [y, m] = e.entryDate.split('-').map(Number);
        return y === now.getFullYear() && m - 1 === now.getMonth();
      })
      .reduce((a, e) => a + e.value, 0);
    const pending = expenses.filter((e) => !e.paymentDate).length;
    return { total, monthTotal, pending, count: expenses.length };
  }, [expenses]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      category: e.category,
      description: e.description,
      value: e.value,
      entryDate: e.entryDate,
      paymentDate: e.paymentDate,
      receiptUrl: e.receiptUrl,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.value || form.value <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (editing) await updateExpense(editing.id, form);
    else await createExpense(form);
    setOpen(false);
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo maior que 10MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('expense-receipts').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('expense-receipts').getPublicUrl(path);
      setForm((f) => ({ ...f, receiptUrl: data.publicUrl }));
      toast.success('Comprovante enviado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="-m-4 lg:-m-6 min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-[#fafafa] p-4 md:p-6 lg:p-8" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        .obs-heading { font-family: 'Sora', sans-serif; letter-spacing: -0.02em; }
        .obs-card { background: #141414; border: 1px solid rgba(255,255,255,0.05); border-radius: 1.25rem; transition: all .3s ease; }
        .obs-card:hover { border-color: rgba(255,255,255,0.15); }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#171717] border border-white/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h1 className="obs-heading text-xl font-bold">Saídas</h1>
              <p className="text-xs text-[#a1a1a1]">Despesas e pagamentos da empresa</p>
            </div>
          </div>
          <Button onClick={openCreate} className="gap-2 rounded-full bg-white text-black hover:bg-white/90">
            <Plus className="h-4 w-4" /> Nova Saída
          </Button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="obs-card p-5">
            <span className="text-xs text-[#a1a1a1] block mb-2">Total Geral</span>
            <div className="obs-heading text-xl font-bold text-rose-400">{formatBRL(totals.total)}</div>
            <div className="text-[10px] text-[#666] mt-1">{totals.count} lançamentos</div>
          </div>
          <div className="obs-card p-5">
            <span className="text-xs text-[#a1a1a1] block mb-2">Mês Atual</span>
            <div className="obs-heading text-xl font-bold">{formatBRL(totals.monthTotal)}</div>
            <div className="text-[10px] text-[#666] mt-1">despesas do mês</div>
          </div>
          <div className="obs-card p-5">
            <span className="text-xs text-[#a1a1a1] block mb-2">A Pagar</span>
            <div className="obs-heading text-xl font-bold text-amber-400">{totals.pending}</div>
            <div className="text-[10px] text-[#666] mt-1">sem data de pagamento</div>
          </div>
          <div className="obs-card p-5">
            <span className="text-xs text-[#a1a1a1] block mb-2">Categorias</span>
            <div className="obs-heading text-xl font-bold">{CATEGORIES.length}</div>
            <div className="text-[10px] text-[#666] mt-1">tipos disponíveis</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
            <Input
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#141414] border-white/10 text-white"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-48 bg-[#141414] border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-white/10 text-white">
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="obs-card p-12 text-center">
            <Receipt className="h-10 w-10 mx-auto mb-3 text-[#444]" />
            <p className="text-sm text-[#a1a1a1]">Nenhuma saída cadastrada ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((e) => (
              <div key={e.id} className="obs-card p-5 flex gap-4 items-start">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${categoryStyle[e.category]}`}>
                      <Tag className="h-2.5 w-2.5 mr-1" />{e.category}
                    </Badge>
                    {!e.paymentDate && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/20">
                        A pagar
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{e.description || 'Sem descrição'}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#a1a1a1]">
                    <span>Lançado: {formatDate(e.entryDate)}</span>
                    <span>Pago: {formatDate(e.paymentDate)}</span>
                  </div>
                  {e.receiptUrl && (
                    <a
                      href={e.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white underline underline-offset-2"
                    >
                      <FileText className="h-3 w-3" /> Ver comprovante
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="obs-heading text-lg font-bold text-rose-400">{formatBRL(e.value)}</div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/10" onClick={() => openEdit(e)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-rose-500/20 text-rose-400" onClick={() => deleteExpense(e.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#141414] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="obs-heading">{editing ? 'Editar Saída' : 'Nova Saída'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                <SelectTrigger className="bg-[#0a0a0a] border-white/10 mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-white/10 text-white">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Pagamento de fornecedor X..."
                className="bg-[#0a0a0a] border-white/10 mt-1.5 min-h-[70px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.value || ''}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  className="bg-[#0a0a0a] border-white/10 mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Data Lançamento</Label>
                <Input
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                  className="bg-[#0a0a0a] border-white/10 mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Data Pagamento</Label>
                <Input
                  type="date"
                  value={form.paymentDate || ''}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value || null })}
                  className="bg-[#0a0a0a] border-white/10 mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Comprovante</Label>
              <input
                ref={fileInput}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  if (fileInput.current) fileInput.current.value = '';
                }}
              />
              {form.receiptUrl ? (
                <div className="mt-1.5 flex items-center justify-between gap-3 p-2.5 rounded-lg border border-white/10 bg-[#0a0a0a]">
                  <a href={form.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-white/80 hover:text-white truncate">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Comprovante anexado</span>
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:bg-rose-500/20 text-rose-400 shrink-0"
                    onClick={() => setForm({ ...form, receiptUrl: null })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="mt-1.5 w-full h-20 rounded-lg border border-dashed border-white/15 hover:border-white/30 bg-[#0a0a0a] flex flex-col items-center justify-center gap-1 text-[11px] text-[#a1a1a1] hover:text-white transition"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Enviando...' : 'Clique para enviar comprovante'}
                </button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-white/10">Cancelar</Button>
            <Button onClick={handleSave} className="bg-white text-black hover:bg-white/90">
              {editing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}