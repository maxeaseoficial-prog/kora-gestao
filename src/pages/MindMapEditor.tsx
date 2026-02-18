import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Edge,
  Node,
  BackgroundVariant,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Plus, Image, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MindMapNode } from '@/components/mindmap/MindMapNode';

const nodeTypes = {
  mindMapNode: MindMapNode,
};

interface MindMapData {
  id: string;
  name: string;
}

export default function MindMapEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mindMap, setMindMap] = useState<MindMapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      loadMindMap();
    }
  }, [id, user]);

  const loadMindMap = async () => {
    if (!id) return;

    try {
      // Load mind map details
      const { data: mapData, error: mapError } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (mapError) throw mapError;
      if (!mapData) {
        toast.error('Mapa mental não encontrado');
        navigate('/mapas-mentais');
        return;
      }

      setMindMap(mapData);

      // Load nodes
      const { data: nodesData, error: nodesError } = await supabase
        .from('mind_map_nodes')
        .select('*')
        .eq('mind_map_id', id);

      if (nodesError) throw nodesError;

      // Load connections
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('mind_map_connections')
        .select('*')
        .eq('mind_map_id', id);

      if (connectionsError) throw connectionsError;

      // Transform to React Flow format
      const flowNodes: Node[] = (nodesData || []).map((node) => ({
        id: node.id,
        type: 'mindMapNode',
        position: { x: node.position_x, y: node.position_y },
        data: {
          content: node.content || '',
          imageUrl: node.image_url,
          onContentChange: (content: string) => handleNodeContentChange(node.id, content),
          onDelete: () => handleDeleteNode(node.id),
        },
      }));

      const flowEdges: Edge[] = (connectionsData || []).map((conn) => ({
        id: conn.id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        type: 'straight',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error: any) {
      toast.error('Erro ao carregar mapa mental');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeContentChange = useCallback((nodeId: string, content: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, content } }
          : node
      )
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    try {
      const { error } = await supabase
        .from('mind_map_nodes')
        .delete()
        .eq('id', nodeId);

      if (error) throw error;

      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      toast.success('Card removido');
    } catch (error: any) {
      toast.error('Erro ao remover card');
      console.error(error);
    }
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!id || !params.source || !params.target) return;

      try {
        const { data, error } = await supabase
          .from('mind_map_connections')
          .insert({
            mind_map_id: id,
            source_node_id: params.source,
            target_node_id: params.target,
          })
          .select()
          .single();

        if (error) throw error;

        const newEdge: Edge = {
          id: data.id,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'straight',
          animated: true,
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        };

        setEdges((eds) => addEdge(newEdge, eds));
      } catch (error: any) {
        toast.error('Erro ao criar conexão');
        console.error(error);
      }
    },
    [id, setEdges]
  );

  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        try {
          await supabase.from('mind_map_connections').delete().eq('id', edge.id);
        } catch (error) {
          console.error('Error deleting edge:', error);
        }
      }
    },
    []
  );

  const addNode = async () => {
    if (!id) return;

    // Calculate position based on last node
    let newX = 200;
    let newY = 200;
    
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      newX = lastNode.position.x + 220; // Place to the right of last node
      newY = lastNode.position.y;
    }

    try {
      const { data, error } = await supabase
        .from('mind_map_nodes')
        .insert({
          mind_map_id: id,
          content: 'Novo card',
          position_x: newX,
          position_y: newY,
        })
        .select()
        .single();

      if (error) throw error;

      const newNode: Node = {
        id: data.id,
        type: 'mindMapNode',
        position: { x: data.position_x, y: data.position_y },
        data: {
          content: data.content,
          imageUrl: data.image_url,
          onContentChange: (content: string) => handleNodeContentChange(data.id, content),
          onDelete: () => handleDeleteNode(data.id),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      toast.success('Card adicionado');
    } catch (error: any) {
      toast.error('Erro ao adicionar card');
      console.error(error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id || !user) return;

    // Calculate position based on last node
    let newX = 200;
    let newY = 200;
    
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      newX = lastNode.position.x + 220;
      newY = lastNode.position.y;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('mind-map-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mind-map-images')
        .getPublicUrl(fileName);

      // Create a new node with the image
      const { data, error } = await supabase
        .from('mind_map_nodes')
        .insert({
          mind_map_id: id,
          image_url: publicUrl,
          position_x: newX,
          position_y: newY,
        })
        .select()
        .single();

      if (error) throw error;

      const newNode: Node = {
        id: data.id,
        type: 'mindMapNode',
        position: { x: data.position_x, y: data.position_y },
        data: {
          content: data.content,
          imageUrl: publicUrl,
          onContentChange: (content: string) => handleNodeContentChange(data.id, content),
          onDelete: () => handleDeleteNode(data.id),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      toast.success('Imagem adicionada');
    } catch (error: any) {
      toast.error('Erro ao fazer upload da imagem');
      console.error(error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const savePositions = async () => {
    if (!id) return;
    setSaving(true);

    try {
      for (const node of nodes) {
        await supabase
          .from('mind_map_nodes')
          .update({
            position_x: node.position.x,
            position_y: node.position.y,
            content: node.data.content,
          })
          .eq('id', node.id);
      }

      await supabase
        .from('mind_maps')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      toast.success('Mapa mental salvo!');
    } catch (error: any) {
      toast.error('Erro ao salvar');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mapas-mentais')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold">{mindMap?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addNode}>
            <Plus className="h-4 w-4 mr-2" />
            Card
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Image className="h-4 w-4 mr-2" />
            Imagem
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button onClick={savePositions} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-border overflow-hidden bg-muted/30">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeClick={onNodeClick}
           nodeTypes={nodeTypes}
           connectionMode={ConnectionMode.Loose}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'straight',
            animated: true,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          }}
        >
          <Controls />
          <MiniMap 
            nodeStrokeColor="hsl(var(--primary))"
            nodeColor="hsl(var(--card))"
            nodeBorderRadius={8}
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Panel position="bottom-center" className="text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full">
            Arraste de um ponto para outro para conectar • Clique duplo para editar
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
