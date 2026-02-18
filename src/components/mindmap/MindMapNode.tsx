import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MindMapNodeData {
  content: string;
  imageUrl?: string;
  color?: string;
  onContentChange: (content: string) => void;
  onDelete: () => void;
  onColorChange: (color: string | null) => void;
  onAddChild?: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Padrão', value: null, class: 'bg-card border-2 border-border' },
  { label: 'Azul', value: '#3b82f6', class: 'bg-blue-500' },
  { label: 'Verde', value: '#22c55e', class: 'bg-green-500' },
  { label: 'Amarelo', value: '#eab308', class: 'bg-yellow-500' },
  { label: 'Vermelho', value: '#ef4444', class: 'bg-red-500' },
  { label: 'Roxo', value: '#a855f7', class: 'bg-purple-500' },
  { label: 'Rosa', value: '#ec4899', class: 'bg-pink-500' },
  { label: 'Laranja', value: '#f97316', class: 'bg-orange-500' },
];

function MindMapNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as MindMapNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(nodeData.content || '');
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!showColorMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorMenu]);

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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    setShowColorMenu(true);
  };

  const cardColor = nodeData.color;

  return (
    <div
      className="
        relative border-2 rounded-lg shadow-lg min-w-[150px] max-w-[300px]
        transition-all duration-200
        [&:hover_.node-action]:opacity-100
        [&_.react-flow\_\_handle]:hover:!opacity-100
      "
      style={{
        backgroundColor: cardColor || undefined,
        borderColor: selected ? 'hsl(var(--primary))' : undefined,
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <Handle type="source" position={Position.Top} id="top" className="!w-2 !h-2 !bg-primary/60 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-primary/60 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all" />
      <Handle type="source" position={Position.Left} id="left" className="!w-2 !h-2 !bg-primary/60 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-primary/60 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all" />
      <Handle type="target" position={Position.Top} id="top-target" className="!w-2 !h-2 !bg-primary/40 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all !top-0 !-translate-y-1/2" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!w-2 !h-2 !bg-primary/40 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all !bottom-0 !translate-y-1/2 !top-auto" />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-2 !h-2 !bg-primary/40 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all !left-0 !-translate-x-1/2" />
      <Handle type="target" position={Position.Right} id="right-target" className="!w-2 !h-2 !bg-primary/40 !border-0 !opacity-0 hover:!opacity-100 hover:!w-3 hover:!h-3 !transition-all !right-0 !translate-x-1/2 !left-auto" />

      {/* Delete button */}
      <Button
        variant="destructive"
        size="icon"
        className="node-action absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 transition-opacity z-10"
        onClick={(e) => {
          e.stopPropagation();
          nodeData.onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Add child button */}
      {nodeData.onAddChild && (
        <Button
          variant="default"
          size="icon"
          className="node-action absolute -bottom-2 -right-2 h-6 w-6 rounded-full opacity-0 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            nodeData.onAddChild?.();
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}

      {/* Color context menu */}
      {showColorMenu && (
        <div
          ref={menuRef}
          className="absolute z-50 bg-popover border border-border rounded-lg shadow-xl p-2"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <p className="text-xs text-muted-foreground mb-2 px-1">Cor do card</p>
          <div className="flex gap-1.5 flex-wrap max-w-[160px]">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                title={opt.label}
                className={`w-6 h-6 rounded-full ${opt.class} hover:scale-110 transition-transform ring-offset-1 ${
                  (cardColor === opt.value || (!cardColor && !opt.value)) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  nodeData.onColorChange(opt.value);
                  setShowColorMenu(false);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`p-3 ${cardColor ? 'text-white' : ''}`}>
        {nodeData.imageUrl ? (
          <div className="space-y-2">
            <img
              src={nodeData.imageUrl}
              alt="Node image"
              className="max-w-full rounded-md"
              style={{ maxHeight: '200px', objectFit: 'contain' }}
            />
            {content && (
              <p className="text-sm text-center">{content}</p>
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
          <p className={`text-sm whitespace-pre-wrap min-h-[24px] ${!cardColor ? 'text-foreground' : ''}`}>
            {content || 'Clique duplo para editar'}
          </p>
        )}
      </div>
    </div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
