import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Mail, Phone, Trash2, Edit2, X } from 'lucide-react';
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

function CRM() {
  const { crmColumns, setCrmColumns, crmCards, setCrmCards } = useApp();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingCard, setEditingCard] = useState<CRMCard | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({
    clientName: '',
    description: '',
    email: '',
    phone: '',
    serviceType: '',
  });

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
      id: `column-${Date.now()}`,
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

  const addCard = (columnId: string) => {
    if (!newCard.clientName.trim()) return;

    const card: CRMCard = {
      id: `card-${Date.now()}`,
      ...newCard,
      columnId,
      order: crmCards.filter(c => c.columnId === columnId).length,
    };

    setCrmCards([...crmCards, card]);
    setNewCard({
      clientName: '',
      description: '',
      email: '',
      phone: '',
      serviceType: '',
    });
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
          {crmColumns.sort((a, b) => a.order - b.order).map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-72 bg-secondary/50 rounded-xl flex flex-col animate-fade-in"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">{column.title}</h3>
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

              {/* Add Card */}
              {addingCardToColumn === column.id ? (
                <div className="p-2 border-t border-border space-y-2">
                  <Input
                    placeholder="Nome do cliente"
                    value={newCard.clientName}
                    onChange={(e) => setNewCard({ ...newCard, clientName: e.target.value })}
                    autoFocus
                  />
                  <Textarea
                    placeholder="Descrição"
                    value={newCard.description}
                    onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                    className="min-h-[60px]"
                  />
                  <Input
                    placeholder="E-mail"
                    type="email"
                    value={newCard.email}
                    onChange={(e) => setNewCard({ ...newCard, email: e.target.value })}
                  />
                  <Input
                    placeholder="Telefone"
                    value={newCard.phone}
                    onChange={(e) => setNewCard({ ...newCard, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Tipo de serviço"
                    value={newCard.serviceType}
                    onChange={(e) => setNewCard({ ...newCard, serviceType: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addCard(column.id)} className="flex-1">
                      Adicionar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAddingCardToColumn(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCardToColumn(column.id)}
                  className="p-3 border-t border-border text-sm text-muted-foreground hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar cartão
                </button>
              )}
            </div>
          ))}

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

      {/* Edit Card Dialog */}
      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cartão</DialogTitle>
          </DialogHeader>
          {editingCard && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Nome do Cliente</label>
                <Input
                  value={editingCard.clientName}
                  onChange={(e) => setEditingCard({ ...editingCard, clientName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={editingCard.description}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
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
                <label className="text-sm font-medium">Tipo de Serviço</label>
                <Input
                  value={editingCard.serviceType}
                  onChange={(e) => setEditingCard({ ...editingCard, serviceType: e.target.value })}
                  className="mt-1"
                />
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
