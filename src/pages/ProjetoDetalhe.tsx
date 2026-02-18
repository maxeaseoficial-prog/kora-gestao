import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ScrollText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Relatorios from '@/pages/Relatorios';
import Roteiros from '@/pages/Roteiros';
import MapasMentais from '@/pages/MapasMentais';

interface Project {
  id: string;
  name: string;
  client_name: string;
}

export default function ProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) fetchProject();
  }, [id, user]);

  const fetchProject = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client_name')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error('Projeto não encontrado');
        navigate('/projetos');
        return;
      }
      setProject(data);
    } catch (error) {
      toast.error('Erro ao carregar projeto');
      console.error(error);
      navigate('/projetos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projetos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground">{project.client_name}</p>
        </div>
      </div>

      <Tabs defaultValue="relatorios" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="roteiros" className="flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Roteiros</span>
          </TabsTrigger>
          <TabsTrigger value="mapas-mentais" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Mapas Mentais</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="relatorios" className="mt-6">
          <Relatorios projectId={project.id} />
        </TabsContent>
        <TabsContent value="roteiros" className="mt-6">
          <Roteiros projectId={project.id} />
        </TabsContent>
        <TabsContent value="mapas-mentais" className="mt-6">
          <MapasMentais projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
