import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MindMapNodeData {
  content: string;
  imageUrl?: string;
  onContentChange: (content: string) => void;
  onDelete: () => void;
}

function MindMapNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as MindMapNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(nodeData.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!nodeData.imageUrl) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    nodeData.onContentChange(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setContent(nodeData.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        relative bg-card border-2 rounded-lg shadow-lg min-w-[150px] max-w-[300px]
        transition-all duration-200 group
        ${selected ? 'border-primary shadow-xl' : 'border-border hover:border-primary/50'}
      `}
      onDoubleClick={handleDoubleClick}
    >
      {/* Source handles */}
      <Handle type="source" position={Position.Top} id="top" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <Handle type="source" position={Position.Left} id="left" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      {/* Target handles overlapping source handles */}
      <Handle type="target" position={Position.Top} id="top-target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <Handle type="target" position={Position.Right} id="right-target" className="!w-3 !h-3 !bg-primary !border-2 !border-background" />

      {/* Delete button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={(e) => {
          e.stopPropagation();
          nodeData.onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Content */}
      <div className="p-3">
        {nodeData.imageUrl ? (
          <div className="space-y-2">
            <img
              src={nodeData.imageUrl}
              alt="Node image"
              className="max-w-full rounded-md"
              style={{ maxHeight: '200px', objectFit: 'contain' }}
            />
            {content && (
              <p className="text-sm text-center text-foreground">{content}</p>
            )}
          </div>
        ) : isEditing ? (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none border-none p-0 focus-visible:ring-0 bg-transparent"
            placeholder="Digite aqui..."
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap min-h-[24px]">
            {content || 'Clique duplo para editar'}
          </p>
        )}
      </div>
    </div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
