import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, FolderPlus, FileText, Pencil, Trash2, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ScriptFolder {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Script {
  id: string;
  folder_id: string | null;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

const Roteiros = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<ScriptFolder[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Dialog states
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);

  // Form states
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [editingFolder, setEditingFolder] = useState<ScriptFolder | null>(null);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [folderName, setFolderName] = useState('');
  const [scriptToDelete, setScriptToDelete] = useState<Script | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<ScriptFolder | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [foldersRes, scriptsRes] = await Promise.all([
        supabase.from('script_folders').select('*').order('name'),
        supabase.from('scripts').select('*').order('title'),
      ]);

      if (foldersRes.error) throw foldersRes.error;
      if (scriptsRes.error) throw scriptsRes.error;

      setFolders(foldersRes.data || []);
      setScripts(scriptsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar roteiros');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Script CRUD
  const openNewScript = () => {
    setEditingScript(null);
    setScriptTitle('');
    setScriptContent('');
    setScriptDialogOpen(true);
  };

  const openEditScript = (script: Script) => {
    setEditingScript(script);
    setScriptTitle(script.title);
    setScriptContent(script.content || '');
    setScriptDialogOpen(true);
  };

  const handleSaveScript = async () => {
    if (!scriptTitle.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    try {
      if (editingScript) {
        const { error } = await supabase
          .from('scripts')
          .update({ title: scriptTitle, content: scriptContent })
          .eq('id', editingScript.id);
        if (error) throw error;
        toast.success('Roteiro atualizado!');
      } else {
        const { error } = await supabase.from('scripts').insert({
          user_id: user?.id,
          title: scriptTitle,
          content: scriptContent,
        });
        if (error) throw error;
        toast.success('Roteiro criado!');
      }
      setScriptDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error('Erro ao salvar roteiro');
    }
  };

  const confirmDeleteScript = (script: Script) => {
    setScriptToDelete(script);
    setDeleteDialogOpen(true);
  };

  const handleDeleteScript = async () => {
    if (!scriptToDelete) return;
    try {
      const { error } = await supabase.from('scripts').delete().eq('id', scriptToDelete.id);
      if (error) throw error;
      toast.success('Roteiro excluído!');
      setDeleteDialogOpen(false);
      setScriptToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error('Erro ao excluir roteiro');
    }
  };

  // Folder CRUD
  const openNewFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDialogOpen(true);
  };

  const openEditFolder = (folder: ScriptFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) {
      toast.error('O nome da pasta é obrigatório');
      return;
    }

    try {
      if (editingFolder) {
        const { error } = await supabase
          .from('script_folders')
          .update({ name: folderName })
          .eq('id', editingFolder.id);
        if (error) throw error;
        toast.success('Pasta atualizada!');
      } else {
        const { error } = await supabase.from('script_folders').insert({
          user_id: user?.id,
          name: folderName,
        });
        if (error) throw error;
        toast.success('Pasta criada!');
      }
      setFolderDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving folder:', error);
      toast.error('Erro ao salvar pasta');
    }
  };

  const confirmDeleteFolder = (folder: ScriptFolder) => {
    setFolderToDelete(folder);
    setDeleteFolderDialogOpen(true);
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      const { error } = await supabase.from('script_folders').delete().eq('id', folderToDelete.id);
      if (error) throw error;
      toast.success('Pasta excluída!');
      setDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Erro ao excluir pasta');
    }
  };

  // Drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const scriptId = draggableId;
    let newFolderId: string | null = null;

    if (destination.droppableId.startsWith('folder-')) {
      newFolderId = destination.droppableId.replace('folder-', '');
    } else if (destination.droppableId === 'root') {
      newFolderId = null;
    }

    try {
      const { error } = await supabase
        .from('scripts')
        .update({ folder_id: newFolderId })
        .eq('id', scriptId);
      if (error) throw error;

      // Update local state
      setScripts((prev) =>
        prev.map((s) => (s.id === scriptId ? { ...s, folder_id: newFolderId } : s))
      );

      if (newFolderId) {
        setExpandedFolders((prev) => new Set(prev).add(newFolderId!));
      }
    } catch (error) {
      console.error('Error moving script:', error);
      toast.error('Erro ao mover roteiro');
    }
  };

  const rootScripts = scripts.filter((s) => !s.folder_id);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Roteiros</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openNewFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova Pasta
            </Button>
            <Button onClick={openNewScript}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Roteiro
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {/* Folders */}
            {folders.map((folder) => {
              const isExpanded = expandedFolders.has(folder.id);
              const folderScripts = scripts.filter((s) => s.folder_id === folder.id);

              return (
                <Card key={folder.id} className="overflow-hidden">
                  <Droppable droppableId={`folder-${folder.id}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={snapshot.isDraggingOver ? 'bg-accent/50' : ''}
                      >
                        <CardHeader
                          className="py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                          onClick={() => toggleFolder(folder.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              {isExpanded ? (
                                <FolderOpen className="h-5 w-5 text-primary" />
                              ) : (
                                <Folder className="h-5 w-5 text-primary" />
                              )}
                              <CardTitle className="text-base">{folder.name}</CardTitle>
                              <span className="text-sm text-muted-foreground">
                                ({folderScripts.length})
                              </span>
                            </div>
                            <div
                              className="flex gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditFolder(folder)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDeleteFolder(folder)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent className="pt-0 pb-3">
                            <div className="space-y-2 min-h-[40px]">
                              {folderScripts.map((script, index) => (
                                <Draggable
                                  key={script.id}
                                  draggableId={script.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="flex items-center justify-between p-3 bg-background border rounded-lg hover:bg-accent/30 transition-colors"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{script.title}</span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openEditScript(script)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => confirmDeleteScript(script)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {folderScripts.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  Arraste roteiros para esta pasta
                                </p>
                              )}
                              {provided.placeholder}
                            </div>
                          </CardContent>
                        )}
                      </div>
                    )}
                  </Droppable>
                </Card>
              );
            })}

            {/* Root scripts (not in any folder) */}
            <Droppable droppableId="root">
              {(provided, snapshot) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={snapshot.isDraggingOver ? 'bg-accent/50' : ''}
                >
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      Roteiros sem pasta
                      <span className="text-sm text-muted-foreground font-normal">
                        ({rootScripts.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2 min-h-[40px]">
                      {rootScripts.map((script, index) => (
                        <Draggable key={script.id} draggableId={script.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between p-3 bg-background border rounded-lg hover:bg-accent/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{script.title}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditScript(script)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => confirmDeleteScript(script)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {rootScripts.length === 0 && folders.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum roteiro criado. Clique em "Novo Roteiro" para começar.
                        </p>
                      )}
                      {provided.placeholder}
                    </div>
                  </CardContent>
                </Card>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>

      {/* Script Dialog */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScript ? 'Editar Roteiro' : 'Novo Roteiro'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={scriptTitle}
                onChange={(e) => setScriptTitle(e.target.value)}
                placeholder="Digite o título do roteiro"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Escreva o conteúdo do roteiro..."
                className="min-h-[300px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveScript}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Nome da Pasta</label>
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Digite o nome da pasta"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFolder}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Script Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Roteiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o roteiro "{scriptToDelete?.title}"? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteScript}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Dialog */}
      <AlertDialog open={deleteFolderDialogOpen} onOpenChange={setDeleteFolderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pasta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a pasta "{folderToDelete?.name}"? Os roteiros
              dentro dela serão movidos para fora da pasta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Roteiros;
