import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface MindMap {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function MapasMentais({ projectId }: { projectId?: string }) {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MindMap | null>(null);
  const [mapName, setMapName] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMindMaps();
  }, [user]);

  const fetchMindMaps = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('mind_maps')
        .select('*')
        .order('updated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMindMaps(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar mapas mentais');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !mapName.trim()) return;

    try {
      const insertData: any = { name: mapName.trim(), user_id: user.id };
      if (projectId) insertData.project_id = projectId;
      
      const { data, error } = await supabase
        .from('mind_maps')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Mapa mental criado!');
      setIsCreateDialogOpen(false);
      setMapName('');
      navigate(projectId ? `/projetos/${projectId}/mapas-mentais/${data.id}` : `/projetos/mapas-mentais/${data.id}`);
    } catch (error: any) {
      toast.error('Erro ao criar mapa mental');
      console.error(error);
    }
  };

  const handleRename = async () => {
    if (!selectedMap || !mapName.trim()) return;

    try {
      const { error } = await supabase
        .from('mind_maps')
        .update({ name: mapName.trim() })
        .eq('id', selectedMap.id);

      if (error) throw error;
      
      toast.success('Mapa mental renomeado!');
      setIsRenameDialogOpen(false);
      setSelectedMap(null);
      setMapName('');
      fetchMindMaps();
    } catch (error: any) {
      toast.error('Erro ao renomear mapa mental');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedMap) return;

    try {
      const { error } = await supabase
        .from('mind_maps')
        .delete()
        .eq('id', selectedMap.id);

      if (error) throw error;
      
      toast.success('Mapa mental excluído!');
      setIsDeleteDialogOpen(false);
      setSelectedMap(null);
      fetchMindMaps();
    } catch (error: any) {
      toast.error('Erro ao excluir mapa mental');
      console.error(error);
    }
  };

  const openRenameDialog = (map: MindMap) => {
    setSelectedMap(map);
    setMapName(map.name);
    setIsRenameDialogOpen(true);
  };

  const openDeleteDialog = (map: MindMap) => {
    setSelectedMap(map);
    setIsDeleteDialogOpen(true);
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
          <h2 className="text-2xl font-bold">Mapas Mentais</h2>
          <p className="text-muted-foreground">Organize suas ideias visualmente</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Mapa Mental
        </Button>
      </div>

      {mindMaps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum mapa mental</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro mapa mental para começar a organizar suas ideias
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Mapa Mental
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mindMaps.map((map) => (
            <Card key={map.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg truncate flex-1">{map.name}</CardTitle>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDialog(map);
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
                        openDeleteDialog(map);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Atualizado em {new Date(map.updated_at).toLocaleDateString('pt-BR')}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(projectId ? `/projetos/${projectId}/mapas-mentais/${map.id}` : `/projetos/mapas-mentais/${map.id}`)}
                >
                  Abrir
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Mapa Mental</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome do mapa mental"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!mapName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Mapa Mental</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Novo nome"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={!mapName.trim()}>
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mapa mental?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O mapa mental "{selectedMap?.name}" será excluído permanentemente.
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
