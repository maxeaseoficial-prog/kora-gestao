import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Mail, Phone, Trash2, Edit2, X, PartyPopper } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CRMCard, CRMColumn } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type ColorKey =
  | 'blue' | 'sky' | 'cyan' | 'teal' | 'emerald' | 'green' | 'lime'
  | 'yellow' | 'amber' | 'orange' | 'red' | 'rose' | 'pink' | 'fuchsia'
  | 'purple' | 'violet' | 'indigo' | 'slate' | 'gray';

type ColumnTheme = {
  dot: string;
  headerBg: string;
  headerText: string;
  columnBg: string;
  border: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  temperature?: 'Frio' | 'Morno' | 'Quente' | 'Fervendo' | 'Parabéns!';
};

// Full Tailwind class strings so JIT preserves them at build time.
const COLOR_THEMES: Record<ColorKey, ColumnTheme> = {
  blue:     { dot: 'bg-blue-500',     headerBg: 'bg-blue-500/10',     headerText: 'text-blue-600 dark:text-blue-400',       columnBg: 'bg-blue-500/5',     border: 'border-blue-500/30',     cardBg: 'bg-blue-500/10',     cardBorder: 'border-blue-500/40',     badgeBg: 'bg-blue-500/20',     badgeText: 'text-blue-700 dark:text-blue-300',       temperature: 'Frio' },
  sky:      { dot: 'bg-sky-500',      headerBg: 'bg-sky-500/10',      headerText: 'text-sky-600 dark:text-sky-400',         columnBg: 'bg-sky-500/5',      border: 'border-sky-500/30',      cardBg: 'bg-sky-500/10',      cardBorder: 'border-sky-500/40',      badgeBg: 'bg-sky-500/20',      badgeText: 'text-sky-700 dark:text-sky-300',         temperature: 'Frio' },
  cyan:     { dot: 'bg-cyan-500',     headerBg: 'bg-cyan-500/10',     headerText: 'text-cyan-600 dark:text-cyan-400',       columnBg: 'bg-cyan-500/5',     border: 'border-cyan-500/30',     cardBg: 'bg-cyan-500/10',     cardBorder: 'border-cyan-500/40',     badgeBg: 'bg-cyan-500/20',     badgeText: 'text-cyan-700 dark:text-cyan-300',       temperature: 'Frio' },
  teal:     { dot: 'bg-teal-500',     headerBg: 'bg-teal-500/10',     headerText: 'text-teal-600 dark:text-teal-400',       columnBg: 'bg-teal-500/5',     border: 'border-teal-500/30',     cardBg: 'bg-teal-500/10',     cardBorder: 'border-teal-500/40',     badgeBg: 'bg-teal-500/20',     badgeText: 'text-teal-700 dark:text-teal-300' },
  emerald:  { dot: 'bg-emerald-500',  headerBg: 'bg-emerald-500/10',  headerText: 'text-emerald-600 dark:text-emerald-400', columnBg: 'bg-emerald-500/5',  border: 'border-emerald-500/30',  cardBg: 'bg-emerald-500/10',  cardBorder: 'border-emerald-500/40',  badgeBg: 'bg-emerald-500/20',  badgeText: 'text-emerald-700 dark:text-emerald-300', temperature: 'Parabéns!' },
  green:    { dot: 'bg-green-500',    headerBg: 'bg-green-500/10',    headerText: 'text-green-600 dark:text-green-400',     columnBg: 'bg-green-500/5',    border: 'border-green-500/30',    cardBg: 'bg-green-500/10',    cardBorder: 'border-green-500/40',    badgeBg: 'bg-green-500/20',    badgeText: 'text-green-700 dark:text-green-300',     temperature: 'Parabéns!' },
  lime:     { dot: 'bg-lime-500',     headerBg: 'bg-lime-500/10',     headerText: 'text-lime-600 dark:text-lime-400',       columnBg: 'bg-lime-500/5',     border: 'border-lime-500/30',     cardBg: 'bg-lime-500/10',     cardBorder: 'border-lime-500/40',     badgeBg: 'bg-lime-500/20',     badgeText: 'text-lime-700 dark:text-lime-300' },
  yellow:   { dot: 'bg-yellow-500',   headerBg: 'bg-yellow-500/10',   headerText: 'text-yellow-700 dark:text-yellow-400',   columnBg: 'bg-yellow-500/5',   border: 'border-yellow-500/30',   cardBg: 'bg-yellow-500/10',   cardBorder: 'border-yellow-500/40',   badgeBg: 'bg-yellow-500/20',   badgeText: 'text-yellow-800 dark:text-yellow-300',   temperature: 'Morno' },
  amber:    { dot: 'bg-amber-500',    headerBg: 'bg-amber-500/10',    headerText: 'text-amber-700 dark:text-amber-400',     columnBg: 'bg-amber-500/5',    border: 'border-amber-500/30',    cardBg: 'bg-amber-500/10',    cardBorder: 'border-amber-500/40',    badgeBg: 'bg-amber-500/20',    badgeText: 'text-amber-800 dark:text-amber-300',     temperature: 'Morno' },
  orange:   { dot: 'bg-orange-500',   headerBg: 'bg-orange-500/10',   headerText: 'text-orange-600 dark:text-orange-400',   columnBg: 'bg-orange-500/5',   border: 'border-orange-500/30',   cardBg: 'bg-orange-500/10',   cardBorder: 'border-orange-500/40',   badgeBg: 'bg-orange-500/20',   badgeText: 'text-orange-700 dark:text-orange-300',   temperature: 'Morno' },
  red:      { dot: 'bg-red-500',      headerBg: 'bg-red-500/10',      headerText: 'text-red-600 dark:text-red-400',         columnBg: 'bg-red-500/5',      border: 'border-red-500/30',      cardBg: 'bg-red-500/10',      cardBorder: 'border-red-500/40',      badgeBg: 'bg-red-500/20',      badgeText: 'text-red-700 dark:text-red-300',         temperature: 'Quente' },
  rose:     { dot: 'bg-rose-500',     headerBg: 'bg-rose-500/10',     headerText: 'text-rose-600 dark:text-rose-400',       columnBg: 'bg-rose-500/5',     border: 'border-rose-500/30',     cardBg: 'bg-rose-500/10',     cardBorder: 'border-rose-500/40',     badgeBg: 'bg-rose-500/20',     badgeText: 'text-rose-700 dark:text-rose-300',       temperature: 'Quente' },
  pink:     { dot: 'bg-pink-500',     headerBg: 'bg-pink-500/10',     headerText: 'text-pink-600 dark:text-pink-400',       columnBg: 'bg-pink-500/5',     border: 'border-pink-500/30',     cardBg: 'bg-pink-500/10',     cardBorder: 'border-pink-500/40',     badgeBg: 'bg-pink-500/20',     badgeText: 'text-pink-700 dark:text-pink-300' },
  fuchsia:  { dot: 'bg-fuchsia-500',  headerBg: 'bg-fuchsia-500/10',  headerText: 'text-fuchsia-600 dark:text-fuchsia-400', columnBg: 'bg-fuchsia-500/5',  border: 'border-fuchsia-500/30',  cardBg: 'bg-fuchsia-500/10',  cardBorder: 'border-fuchsia-500/40',  badgeBg: 'bg-fuchsia-500/20',  badgeText: 'text-fuchsia-700 dark:text-fuchsia-300' },
  purple:   { dot: 'bg-purple-500',   headerBg: 'bg-purple-500/10',   headerText: 'text-purple-600 dark:text-purple-400',   columnBg: 'bg-purple-500/5',   border: 'border-purple-500/30',   cardBg: 'bg-purple-500/10',   cardBorder: 'border-purple-500/40',   badgeBg: 'bg-purple-500/20',   badgeText: 'text-purple-700 dark:text-purple-300' },
  violet:   { dot: 'bg-violet-500',   headerBg: 'bg-violet-500/10',   headerText: 'text-violet-600 dark:text-violet-400',   columnBg: 'bg-violet-500/5',   border: 'border-violet-500/30',   cardBg: 'bg-violet-500/10',   cardBorder: 'border-violet-500/40',   badgeBg: 'bg-violet-500/20',   badgeText: 'text-violet-700 dark:text-violet-300' },
  indigo:   { dot: 'bg-indigo-500',   headerBg: 'bg-indigo-500/10',   headerText: 'text-indigo-600 dark:text-indigo-400',   columnBg: 'bg-indigo-500/5',   border: 'border-indigo-500/30',   cardBg: 'bg-indigo-500/10',   cardBorder: 'border-indigo-500/40',   badgeBg: 'bg-indigo-500/20',   badgeText: 'text-indigo-700 dark:text-indigo-300',   temperature: 'Frio' },
  slate:    { dot: 'bg-slate-500',    headerBg: 'bg-slate-500/10',    headerText: 'text-slate-600 dark:text-slate-300',     columnBg: 'bg-slate-500/5',    border: 'border-slate-500/30',    cardBg: 'bg-slate-500/10',    cardBorder: 'border-slate-500/40',    badgeBg: 'bg-slate-500/20',    badgeText: 'text-slate-700 dark:text-slate-300' },
  gray:     { dot: 'bg-muted-foreground', headerBg: 'bg-secondary', headerText: 'text-foreground', columnBg: 'bg-secondary/50', border: 'border-border', cardBg: 'bg-card', cardBorder: 'border-border', badgeBg: 'bg-secondary', badgeText: 'text-muted-foreground' },
};

const COLOR_OPTIONS: { key: ColorKey; label: string; swatch: string }[] = [
  { key: 'blue',    label: 'Azul',      swatch: 'bg-blue-500' },
  { key: 'sky',     label: 'Céu',       swatch: 'bg-sky-500' },
  { key: 'cyan',    label: 'Ciano',     swatch: 'bg-cyan-500' },
  { key: 'teal',    label: 'Turquesa',  swatch: 'bg-teal-500' },
  { key: 'emerald', label: 'Esmeralda', swatch: 'bg-emerald-500' },
  { key: 'green',   label: 'Verde',     swatch: 'bg-green-500' },
  { key: 'lime',    label: 'Lima',      swatch: 'bg-lime-500' },
  { key: 'yellow',  label: 'Amarelo',   swatch: 'bg-yellow-500' },
  { key: 'amber',   label: 'Âmbar',     swatch: 'bg-amber-500' },
  { key: 'orange',  label: 'Laranja',   swatch: 'bg-orange-500' },
  { key: 'red',     label: 'Vermelho',  swatch: 'bg-red-500' },
  { key: 'rose',    label: 'Rosa',      swatch: 'bg-rose-500' },
  { key: 'pink',    label: 'Pink',      swatch: 'bg-pink-500' },
  { key: 'fuchsia', label: 'Fúcsia',    swatch: 'bg-fuchsia-500' },
  { key: 'purple',  label: 'Roxo',      swatch: 'bg-purple-500' },
  { key: 'violet',  label: 'Violeta',   swatch: 'bg-violet-500' },
  { key: 'indigo',  label: 'Índigo',    swatch: 'bg-indigo-500' },
  { key: 'slate',   label: 'Ardósia',   swatch: 'bg-slate-500' },
  { key: 'gray',    label: 'Cinza',     swatch: 'bg-muted-foreground' },
];

function inferColorFromTitle(title: string): ColorKey {
  const t = title.trim().toLowerCase();
  if (t.includes('prospect')) return 'blue';
  if (t.includes('contato')) return 'yellow';
  if (t.includes('reuni')) return 'orange';
  if (t.includes('negocia')) return 'red';
  if (t.includes('ganh')) return 'green';
  return 'gray';
}

function resolveColor(column: CRMColumn): ColorKey {
  const t = column.title.trim().toLowerCase();
  // Force these two titles to their canonical colors regardless of stored value
  if (t.includes('reuni')) return 'orange';
  if (t.includes('negocia')) return 'red';
  const c = (column.color || '').toLowerCase();
  if (c in COLOR_THEMES) return c as ColorKey;
  return inferColorFromTitle(column.title);
}

function getColumnTheme(column: CRMColumn): ColumnTheme {
  const base = COLOR_THEMES[resolveColor(column)];
  // Title-based temperature overrides (e.g. "Em Negociação" => Fervendo)
  if (column.title.trim().toLowerCase().includes('negocia')) {
    return { ...base, temperature: 'Fervendo' };
  }
  return base;
}

const EMPTY_CARD = {
  clientName: '',
  description: '',
  email: '',
  phone: '',
  serviceType: '',
  role: '',
  company: '',
  revenue: '' as string,
  city: '',
  notes: '',
};

const CRM_OPEN_DIALOG_KEY = 'kora-crm-open-dialog';

type CrmOpenDialogState =
  | { type: 'add'; columnId: string; draft: typeof EMPTY_CARD }
  | { type: 'edit'; card: CRMCard };

function readOpenDialogState(): CrmOpenDialogState | null {
  try {
    const raw = sessionStorage.getItem(CRM_OPEN_DIALOG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearOpenDialogState() {
  try {
    sessionStorage.removeItem(CRM_OPEN_DIALOG_KEY);
  } catch {}
}

function CRM() {
  const { crmColumns, setCrmColumns, crmCards, setCrmCards } = useApp();
  const navigate = useNavigate();
  const restoredDialog = useRef<CrmOpenDialogState | null>(readOpenDialogState());
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState<ColorKey>('gray');
  const [editingCard, setEditingCard] = useState<CRMCard | null>(
    restoredDialog.current?.type === 'edit' ? restoredDialog.current.card : null,
  );
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(restoredDialog.current?.type === 'edit');
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(
    restoredDialog.current?.type === 'add' ? restoredDialog.current.columnId : null,
  );
  const [newCard, setNewCard] = useState(
    restoredDialog.current?.type === 'add' ? restoredDialog.current.draft : { ...EMPTY_CARD },
  );
  const [newCardErrors, setNewCardErrors] = useState<{ clientName?: boolean }>({});
  const [cardPendingDelete, setCardPendingDelete] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ active: boolean; startX: number; startY: number; scrollLeft: number; scrollTop: number; moved: boolean }>({
    active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false,
  });

  useEffect(() => {
    try {
      if (addingCardToColumn) {
        sessionStorage.setItem(
          CRM_OPEN_DIALOG_KEY,
          JSON.stringify({ type: 'add', columnId: addingCardToColumn, draft: newCard }),
        );
        return;
      }

      if (isCardDialogOpen && editingCard) {
        sessionStorage.setItem(
          CRM_OPEN_DIALOG_KEY,
          JSON.stringify({ type: 'edit', card: editingCard }),
        );
        return;
      }

      clearOpenDialogState();
    } catch {}
  }, [addingCardToColumn, newCard, isCardDialogOpen, editingCard]);

  const onPanMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Don't start panning if the click is on a draggable card or interactive control
    if (target.closest('[data-rfd-draggable-id], [data-rbd-draggable-id], [data-rfd-drag-handle-draggable-id]') || target.closest('button, a, input, textarea, [role="menuitem"]')) {
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    panState.current = {
      active: true,
      startX: e.pageX,
      startY: e.pageY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
      moved: false,
    };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };

  const onPanMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const s = panState.current;
    if (!s.active) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.pageX - s.startX;
    const dy = e.pageY - s.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) s.moved = true;
    el.scrollLeft = s.scrollLeft - dx;
    el.scrollTop = s.scrollTop - dy;
  };

  const endPan = () => {
    const el = scrollRef.current;
    if (el) {
      el.style.cursor = '';
      el.style.userSelect = '';
    }
    panState.current.active = false;
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const card = crmCards.find(c => c.id === draggableId);
    if (!card) return;

    const newCards = crmCards.filter(c => c.id !== draggableId);
    
    const destCards = newCards
      .filter(c => c.columnId === destination.droppableId)
      .sort((a, b) => a.order - b.order);

    const updatedCard = { ...card, columnId: destination.droppableId, order: destination.index };
    
    destCards.splice(destination.index, 0, updatedCard);
    
    const reorderedDestCards = destCards.map((c, idx) => ({ ...c, order: idx }));
    
    const otherCards = newCards.filter(c => c.columnId !== destination.droppableId);
    
    setCrmCards([...otherCards, ...reorderedDestCards]);

    // Se moveu para uma coluna "Ganhou", abre o cadastro de cliente com dados pré-preenchidos
    const destColumn = crmColumns.find(c => c.id === destination.droppableId);
    const sourceColumn = crmColumns.find(c => c.id === source.droppableId);
    const isGanhou = destColumn && destColumn.title.trim().toLowerCase().includes('ganh');
    const wasGanhou = sourceColumn && sourceColumn.title.trim().toLowerCase().includes('ganh');
    if (isGanhou && !wasGanhou) {
      navigate('/clientes', {
        state: {
          prefillClient: {
            clientType: card.company ? 'empresa' : 'pessoa',
            name: card.clientName || '',
            company: card.company || '',
            email: card.email || '',
            phone: card.phone || '',
            serviceType: card.serviceType || '',
            notes: card.notes || '',
            city: card.city || '',
          },
        },
      });
    }

    // Se moveu para uma coluna de "Reunião marcada", abre a Agenda para agendar
    const isReuniao = destColumn && /reuni[aã]o/i.test(destColumn.title);
    const wasReuniao = sourceColumn && /reuni[aã]o/i.test(sourceColumn.title);
    if (isReuniao && !wasReuniao) {
      const parts = [card.clientName, card.company].filter(Boolean).join(' — ');
      navigate('/agenda', {
        state: {
          prefillEvent: {
            title: `Reunião ${parts}`.trim(),
            description: card.notes || card.description || '',
            location: card.city || '',
          },
        },
      });
    }
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    
    const newColumn: CRMColumn = {
      id: crypto.randomUUID(),
      title: newColumnTitle,
      order: crmColumns.length,
      color: newColumnColor,
    };
    
    setCrmColumns([...crmColumns, newColumn]);
    setNewColumnTitle('');
    setNewColumnColor('gray');
    setIsAddingColumn(false);
  };

  const deleteColumn = (columnId: string) => {
    setCrmColumns(crmColumns.filter(c => c.id !== columnId));
    setCrmCards(crmCards.filter(c => c.columnId !== columnId));
  };

  const renameColumn = (columnId: string, newTitle: string) => {
    setCrmColumns(crmColumns.map(c => 
      c.id === columnId ? { ...c, title: newTitle } : c
    ));
  };

  const addCard = () => {
    if (!addingCardToColumn) return;
    if (!newCard.clientName.trim()) {
      setNewCardErrors({ clientName: true });
      return;
    }
    setNewCardErrors({});

    const revenueNum = newCard.revenue !== '' ? Number(newCard.revenue) : null;

    const card: CRMCard = {
      id: crypto.randomUUID(),
      clientName: newCard.clientName,
      description: newCard.description,
      email: newCard.email,
      phone: newCard.phone,
      serviceType: newCard.serviceType,
      role: newCard.role,
      company: newCard.company,
      revenue: Number.isFinite(revenueNum as number) ? (revenueNum as number) : null,
      city: newCard.city,
      notes: newCard.notes,
      columnId: addingCardToColumn,
      order: crmCards.filter(c => c.columnId === addingCardToColumn).length,
    };

    setCrmCards([...crmCards, card]);
    setNewCard({ ...EMPTY_CARD });
    setAddingCardToColumn(null);
    clearOpenDialogState();
  };

  const updateCard = () => {
    if (!editingCard) return;
    
    setCrmCards(crmCards.map(c => 
      c.id === editingCard.id ? editingCard : c
    ));
    setEditingCard(null);
    setIsCardDialogOpen(false);
    clearOpenDialogState();
  };

  const deleteCard = (cardId: string) => {
    setCrmCards(crmCards.filter(c => c.id !== cardId));
    setIsCardDialogOpen(false);
    setEditingCard(null);
    clearOpenDialogState();
  };

  const openEditDialog = (card: CRMCard) => {
    setEditingCard(card);
    setIsCardDialogOpen(true);
  };

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
      {(() => {
        const pendingTotal = crmCards.reduce((sum, c) => {
          const col = crmColumns.find((k) => k.id === c.columnId);
          if (!col) return sum;
          const t = col.title.trim().toLowerCase();
          const isFinalized = t.includes('ganh') || t.includes('perd');
          if (isFinalized) return sum;
          return sum + Number(c.revenue || 0);
        }, 0);
        const pendingCount = crmCards.filter((c) => {
          const col = crmColumns.find((k) => k.id === c.columnId);
          if (!col) return false;
          const t = col.title.trim().toLowerCase();
          return !(t.includes('ganh') || t.includes('perd'));
        }).length;
        return (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor pendente no CRM</p>
              <p className="text-xl font-bold text-foreground">
                {pendingTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Leads pendentes</p>
              <p className="text-xl font-bold text-foreground">{pendingCount}</p>
            </div>
          </div>
        );
      })()}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          ref={scrollRef}
          onMouseDown={onPanMouseDown}
          onMouseMove={onPanMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          className="flex gap-4 flex-1 min-h-0 overflow-x-auto pb-4 cursor-grab"
        >
          {crmColumns.sort((a, b) => a.order - b.order).map((column) => {
            const theme = getColumnTheme(column);
            return (
            <div
              key={column.id}
              className={cn(
                "flex-shrink-0 w-72 rounded-xl flex flex-col animate-fade-in border",
                theme.columnBg,
                theme.border
              )}
            >
              {/* Column Header */}
              <div className={cn("p-3 border-b flex items-center justify-between rounded-t-xl", theme.headerBg, theme.border)}>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", theme.dot)} />
                  <h3 className={cn("font-semibold text-sm", theme.headerText)}>{column.title}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        const newTitle = prompt('Novo nome da coluna:', column.title);
                        if (newTitle) renameColumn(column.id, newTitle);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteColumn(column.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Cards */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]",
                      snapshot.isDraggingOver && "bg-accent/50"
                    )}
                  >
                    {crmCards
                      .filter(c => c.columnId === column.id)
                      .sort((a, b) => a.order - b.order)
                      .map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => openEditDialog(card)}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all",
                                theme.cardBg,
                                theme.cardBorder,
                                snapshot.isDragging && "shadow-lg rotate-2"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm">{card.clientName}</h4>
                                {theme.temperature && (
                                  <span className={cn(
                                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap",
                                    theme.badgeBg,
                                    theme.badgeText
                                  )}>
                                    {theme.temperature === 'Parabéns!' && <PartyPopper className="h-3 w-3" />}
                                    {theme.temperature}
                                  </span>
                                )}
                              </div>
                              {card.company && (
                                <p className="text-xs text-muted-foreground mt-0.5">{card.company}</p>
                              )}
                              {card.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {card.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {card.email && (
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                )}
                                {card.phone && (
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                )}
                                {card.serviceType && (
                                  <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                                    {card.serviceType}
                                  </span>
                                )}
                              </div>
                              {typeof card.revenue === 'number' && card.revenue > 0 && (
                                <div className="mt-2 text-xs font-semibold text-foreground">
                                  {card.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Card Button */}
              <button
                onClick={() => {
                  setNewCard({ ...EMPTY_CARD });
                  setAddingCardToColumn(column.id);
                }}
                className={cn("p-3 border-t text-sm text-muted-foreground hover:bg-accent transition-colors flex items-center gap-2 rounded-b-xl", theme.border)}
              >
                <Plus className="h-4 w-4" />
                Adicionar cartão
              </button>
            </div>
            );
          })}

          {/* Add Column */}
          {isAddingColumn ? (
            <div className="flex-shrink-0 w-72 bg-secondary/50 rounded-xl p-3 space-y-3 animate-fade-in">
              <Input
                placeholder="Nome da coluna"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addColumn()}
              />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Cor da coluna</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setNewColumnColor(opt.key)}
                      title={opt.label}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 transition-transform",
                        opt.swatch,
                        newColumnColor === opt.key
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addColumn} className="flex-1">
                  Adicionar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setIsAddingColumn(false); setNewColumnColor('gray'); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex-shrink-0 w-72 h-12 bg-secondary/30 rounded-xl text-sm text-muted-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar coluna
            </button>
          )}
        </div>
      </DragDropContext>

      {/* Add Card Dialog */}
      <Dialog
        open={addingCardToColumn !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddingCardToColumn(null);
            setNewCard({ ...EMPTY_CARD });
            setNewCardErrors({});
            clearOpenDialogState();
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={newCard.clientName}
                  onChange={(e) => {
                    setNewCard({ ...newCard, clientName: e.target.value });
                    if (e.target.value.trim()) setNewCardErrors((p) => ({ ...p, clientName: false }));
                  }}
                  className={`mt-1 ${newCardErrors.clientName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  autoFocus
                />
                {newCardErrors.clientName && (
                  <p className="text-xs text-red-500 mt-1">Preencha o nome</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Cargo</label>
                <Input
                  value={newCard.role}
                  onChange={(e) => setNewCard({ ...newCard, role: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Empresa</label>
                <Input
                  value={newCard.company}
                  onChange={(e) => setNewCard({ ...newCard, company: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">E-mail</label>
                <Input
                  type="email"
                  value={newCard.email}
                  onChange={(e) => setNewCard({ ...newCard, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={newCard.phone}
                  onChange={(e) => setNewCard({ ...newCard, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Cidade</label>
                <Input
                  value={newCard.city}
                  onChange={(e) => setNewCard({ ...newCard, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Tipo de serviço</label>
                <Input
                  value={newCard.serviceType}
                  onChange={(e) => setNewCard({ ...newCard, serviceType: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Valor do serviço</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCard.revenue}
                  onChange={(e) => setNewCard({ ...newCard, revenue: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newCard.description}
                  onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={newCard.notes}
                  onChange={(e) => setNewCard({ ...newCard, notes: e.target.value })}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={addCard} className="flex-1">Adicionar</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAddingCardToColumn(null);
                  clearOpenDialogState();
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog
        open={isCardDialogOpen}
        onOpenChange={(open) => {
          setIsCardDialogOpen(open);
          if (!open) {
            setEditingCard(null);
            clearOpenDialogState();
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={editingCard.clientName}
                    onChange={(e) => setEditingCard({ ...editingCard, clientName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cargo</label>
                  <Input
                    value={editingCard.role || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, role: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Empresa</label>
                  <Input
                    value={editingCard.company || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, company: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <Input
                    type="email"
                    value={editingCard.email || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={editingCard.phone || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <Input
                    value={editingCard.city || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Tipo de serviço</label>
                  <Input
                    value={editingCard.serviceType}
                    onChange={(e) => setEditingCard({ ...editingCard, serviceType: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Valor do serviço</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingCard.revenue ?? ''}
                    onChange={(e) => setEditingCard({ ...editingCard, revenue: e.target.value === '' ? null : Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={editingCard.description}
                    onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    value={editingCard.notes || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={updateCard} className="flex-1">
                  Salvar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setCardPendingDelete(editingCard.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cardPendingDelete} onOpenChange={(open) => !open && setCardPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir card?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O card será removido permanentemente do CRM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cardPendingDelete) deleteCard(cardPendingDelete);
                setCardPendingDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CRM;
