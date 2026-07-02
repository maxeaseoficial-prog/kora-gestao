import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Mail, Phone, Trash2, Edit2, X, Building2, MapPin } from 'lucide-react';
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
import { cn } from '@/lib/utils';

type ColumnTheme = {
  dot: string;
  headerBg: string;
  headerText: string;
  columnBg: string;
  border: string;
};

const DEFAULT_THEME: ColumnTheme = {
  dot: 'bg-muted-foreground',
  headerBg: 'bg-secondary',
  headerText: 'text-foreground',
  columnBg: 'bg-secondary/50',
  border: 'border-border',
};

function getColumnTheme(title: string): ColumnTheme {
  const t = title.trim().toLowerCase();
  if (t.includes('prospect')) {
    return {
      dot: 'bg-blue-500',
      headerBg: 'bg-blue-500/10',
      headerText: 'text-blue-600 dark:text-blue-400',
      columnBg: 'bg-blue-500/5',
      border: 'border-blue-500/30',
    };
  }
  if (t.includes('contato')) {
    return {
      dot: 'bg-yellow-500',
      headerBg: 'bg-yellow-500/10',
      headerText: 'text-yellow-700 dark:text-yellow-400',
      columnBg: 'bg-yellow-500/5',
      border: 'border-yellow-500/30',
    };
  }
  if (t.includes('reuni')) {
    return {
      dot: 'bg-red-500',
      headerBg: 'bg-red-500/10',
      headerText: 'text-red-600 dark:text-red-400',
      columnBg: 'bg-red-500/5',
      border: 'border-red-500/30',
    };
  }
  if (t.includes('ganh')) {
    return {
      dot: 'bg-green-500',
      headerBg: 'bg-green-500/10',
      headerText: 'text-green-600 dark:text-green-400',
      columnBg: 'bg-green-500/5',
      border: 'border-green-500/30',
    };
  }
  return DEFAULT_THEME;
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

function CRM() {
  const { crmColumns, setCrmColumns, crmCards, setCrmCards } = useApp();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingCard, setEditingCard] = useState<CRMCard | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ ...EMPTY_CARD });

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
  };

  const addColumn = () => {
    if (!newColumnTitle.trim()) return;
    
    const newColumn: CRMColumn = {
      id: crypto.randomUUID(),
      title: newColumnTitle,
      order: crmColumns.length,
    };
    
    setCrmColumns([...crmColumns, newColumn]);
    setNewColumnTitle('');
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
    if (!newCard.clientName.trim()) return;

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
  };

  const updateCard = () => {
    if (!editingCard) return;
    
    setCrmCards(crmCards.map(c => 
      c.id === editingCard.id ? editingCard : c
    ));
    setEditingCard(null);
    setIsCardDialogOpen(false);
  };

  const deleteCard = (cardId: string) => {
    setCrmCards(crmCards.filter(c => c.id !== cardId));
    setIsCardDialogOpen(false);
  };

  const openEditDialog = (card: CRMCard) => {
    setEditingCard(card);
    setIsCardDialogOpen(true);
  };

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {crmColumns.sort((a, b) => a.order - b.order).map((column) => {
            const theme = getColumnTheme(column.title);
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
                                "p-3 bg-card rounded-lg border border-border cursor-pointer hover:shadow-md transition-all",
                                snapshot.isDragging && "shadow-lg rotate-2"
                              )}
                            >
                              <h4 className="font-medium text-sm">{card.clientName}</h4>
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
            <div className="flex-shrink-0 w-72 bg-secondary/50 rounded-xl p-3 space-y-2 animate-fade-in">
              <Input
                placeholder="Nome da coluna"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && addColumn()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addColumn} className="flex-1">
                  Adicionar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingColumn(false)}
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
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={newCard.clientName}
                  onChange={(e) => setNewCard({ ...newCard, clientName: e.target.value })}
                  className="mt-1"
                  autoFocus
                />
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
              <div>
                <label className="text-sm font-medium">Faturamento</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCard.revenue}
                  onChange={(e) => setNewCard({ ...newCard, revenue: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
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
              <Button variant="ghost" onClick={() => setAddingCardToColumn(null)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                <div>
                  <label className="text-sm font-medium">Faturamento</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingCard.revenue ?? ''}
                    onChange={(e) => setEditingCard({ ...editingCard, revenue: e.target.value === '' ? null : Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
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
                  onClick={() => deleteCard(editingCard.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CRM;
