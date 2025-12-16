import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Folder,
  FolderOpen,
  FileText,
  Map,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProcessNode {
  id: number;
  titulo: string;
  type: 'macro' | 'process' | 'map';
  children?: ProcessNode[];
  proc_id?: number;
  data_criacao?: string;
}

const fetchHierarchy = async (): Promise<ProcessNode[]> => {
  const response = await fetch('http://localhost:8000/hierarchy/');
  if (!response.ok) {
    throw new Error('Failed to fetch hierarchy');
  }
  const data = await response.json();
  return data.hierarchy;
};

// Cores por tipo de nó
const getNodeColors = (type: string) => {
  switch (type) {
    case 'macro':
      return {
        bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
        border: 'border-violet-400',
        text: 'text-white',
        shadow: 'shadow-violet-200',
        line: '#8b5cf6'
      };
    case 'process':
      return {
        bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        border: 'border-blue-400',
        text: 'text-white',
        shadow: 'shadow-blue-200',
        line: '#3b82f6'
      };
    case 'map':
      return {
        bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        border: 'border-emerald-400',
        text: 'text-white',
        shadow: 'shadow-emerald-200',
        line: '#10b981'
      };
    default:
      return {
        bg: 'bg-gradient-to-br from-gray-500 to-slate-600',
        border: 'border-gray-400',
        text: 'text-white',
        shadow: 'shadow-gray-200',
        line: '#6b7280'
      };
  }
};

const getNodeIcon = (type: string, isExpanded: boolean) => {
  switch (type) {
    case 'macro':
      return isExpanded ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />;
    case 'process':
      return <FileText className="h-5 w-5" />;
    case 'map':
      return <Map className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

interface TreeNodeProps {
  node: ProcessNode;
  level: number;
  expandedNodes: Set<number>;
  toggleNode: (id: number) => void;
  scale: number;
}

const TreeNode = ({ node, level, expandedNodes, toggleNode, scale }: TreeNodeProps) => {
  const colors = getNodeColors(node.type);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const nodeKey = `${node.type}-${node.id}`;

  const handleMapClick = (mapId: number, mode: 'view' | 'edit') => {
    window.open(`http://localhost:8080?mapa=${mapId}&mode=${mode}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center">
      {/* Nó */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={`
                relative cursor-pointer transition-all duration-300 
                hover:scale-105 hover:shadow-xl
                ${colors.bg} ${colors.text} ${colors.shadow}
                border-2 ${colors.border}
                min-w-[180px] max-w-[220px]
              `}
              style={{ 
                transform: `scale(${scale})`,
                transformOrigin: 'top center'
              }}
              onClick={() => hasChildren && toggleNode(node.id)}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getNodeIcon(node.type, isExpanded)}
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-white/20 text-white border-0"
                  >
                    {node.type === 'macro' ? 'Macro' : node.type === 'process' ? 'Processo' : 'Mapa'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                  {node.titulo}
                </h3>
                {hasChildren && (
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20">
                    <span className="text-xs opacity-80">
                      {node.children!.length} {node.children!.length === 1 ? 'item' : 'itens'}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
                {node.type === 'map' && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-white/20">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMapClick(node.id, 'view');
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMapClick(node.id, 'edit');
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{node.titulo}</p>
            <p className="text-xs text-muted-foreground">
              Tipo: {node.type === 'macro' ? 'Macroprocesso' : node.type === 'process' ? 'Processo' : 'Mapa'}
            </p>
            {node.data_criacao && (
              <p className="text-xs text-muted-foreground">
                Criado: {new Date(node.data_criacao).toLocaleDateString('pt-BR')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Linha vertical para filhos */}
      {hasChildren && isExpanded && (
        <>
          <div 
            className="w-0.5 h-8 mt-2"
            style={{ backgroundColor: colors.line }}
          />
          
          {/* Container dos filhos */}
          <div className="flex gap-8 relative">
            {/* Linha horizontal conectando filhos */}
            {node.children!.length > 1 && (
              <div 
                className="absolute top-0 h-0.5 left-1/2 -translate-x-1/2"
                style={{ 
                  backgroundColor: colors.line,
                  width: `calc(100% - 180px * ${scale})`,
                }}
              />
            )}
            
            {node.children!.map((child, index) => (
              <div key={`${child.type}-${child.id}`} className="flex flex-col items-center">
                {/* Linha vertical do filho */}
                <div 
                  className="w-0.5 h-6"
                  style={{ backgroundColor: getNodeColors(child.type).line }}
                />
                <TreeNode
                  node={child}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  scale={scale}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function ProcessTreeView() {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const { data: hierarchy = [], isLoading, error } = useQuery<ProcessNode[]>({
    queryKey: ['hierarchy'],
    queryFn: fetchHierarchy,
  });

  // Expandir todos os nós inicialmente
  const expandAll = useCallback(() => {
    const getAllIds = (nodes: ProcessNode[]): number[] => {
      return nodes.flatMap(node => [
        node.id,
        ...(node.children ? getAllIds(node.children) : [])
      ]);
    };
    setExpandedNodes(new Set(getAllIds(hierarchy)));
  }, [hierarchy]);

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const toggleNode = (id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const zoomIn = () => setScale(s => Math.min(s + 0.1, 1.5));
  const zoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
  const resetZoom = () => setScale(1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando árvore de processos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-destructive font-medium">Erro ao carregar hierarquia</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  Árvore de Processos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Visualização completa da hierarquia
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button variant="ghost" size="sm" onClick={zoomOut} className="h-8 w-8 p-0">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2 min-w-[50px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button variant="ghost" size="sm" onClick={zoomIn} className="h-8 w-8 p-0">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetZoom} className="h-8 w-8 p-0">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-border mx-2" />

              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir Todos
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Recolher Todos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">Legenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-500 to-purple-600" />
            <span>Macroprocesso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-cyan-600" />
            <span>Processo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-500 to-teal-600" />
            <span>Mapa</span>
          </div>
        </div>
      </div>

      {/* Área da Árvore */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="container mx-auto px-4 py-8">
          {hierarchy.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum processo encontrado</h3>
              <p className="text-muted-foreground">
                Crie um macroprocesso para começar a organizar seus processos.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-16 pb-8">
              {hierarchy.map(node => (
                <TreeNode
                  key={`${node.type}-${node.id}`}
                  node={node}
                  level={0}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  scale={scale}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}