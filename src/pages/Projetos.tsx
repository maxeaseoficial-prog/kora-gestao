import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  client_id: string | null;
  client_name: string;
  created_at: string;
  updated_at: string;
}

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('custom');
  const [customClientName, setCustomClientName] = useState('');
  const { user } = useAuth();
  const { clients } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      toast.error('Erro ao carregar projetos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !projectName.trim()) return;

    const clientName = selectedClientId === 'custom'
      ? customClientName.trim() || projectName.trim()
      : clients.find(c => c.id === selectedClientId)?.name || projectName.trim();

    const clientId = selectedClientId === 'custom' ? null : selectedClientId;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          client_id: clientId,
          client_name: clientName,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Projeto criado!');
      setIsCreateDialogOpen(false);
      setProjectName('');
      setSelectedClientId('custom');
      setCustomClientName('');
      navigate(`/projetos/${data.id}`);
    } catch (error) {
      toast.error('Erro ao criar projeto');
      console.error(error);
    }
  };

  const handleRename = async () => {
    if (!selectedProject || !projectName.trim()) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: projectName.trim() })
        .eq('id', selectedProject.id);
      if (error) throw error;
      toast.success('Projeto renomeado!');
      setIsRenameDialogOpen(false);
      setSelectedProject(null);
      setProjectName('');
      fetchProjects();
    } catch (error) {
      toast.error('Erro ao renomear projeto');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', selectedProject.id);
      if (error) throw error;
      toast.success('Projeto excluído!');
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      toast.error('Erro ao excluir projeto');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerencie seus projetos com relatórios, roteiros e mapas mentais</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro projeto para organizar relatórios, roteiros e mapas mentais
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/projetos/${project.id}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{project.client_name}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setProjectName(project.name);
                        setIsRenameDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Atualizado em {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Projeto</label>
              <Input
                placeholder="Ex: Campanha Verão 2026"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Outro (digitar nome)</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company ? `- ${client.company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClientId === 'custom' && (
              <div>
                <label className="text-sm font-medium">Nome do Cliente</label>
                <Input
                  placeholder="Digite o nome do cliente"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!projectName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Projeto</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Novo nome"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRename} disabled={!projectName.trim()}>Renomear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto "{selectedProject?.name}" e todos os seus relatórios, roteiros e mapas mentais serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
