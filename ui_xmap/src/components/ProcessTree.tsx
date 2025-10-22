import { useState } from "react";
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Plus,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

interface ProcessNode {
  id: number;
  titulo: string;
  type: 'macro' | 'process';
  children?: ProcessNode[];
  has_map?: boolean;
  isExpanded?: boolean;
}

const fetchHierarchy = async (): Promise<ProcessNode[]> => {
  const response = await fetch('http://localhost:8000/hierarchy/');
  if (!response.ok) {
    throw new Error('Failed to fetch hierarchy');
  }
  const data = await response.json();
  // Add isExpanded to macros by default
  return data.hierarchy.map((node: ProcessNode) => ({
    ...node,
    isExpanded: true,
  }));
};

export const ProcessTree = () => {
  const { data: processes = [], isLoading, error } = useQuery<ProcessNode[]>({
    queryKey: ['hierarchy'],
    queryFn: fetchHierarchy,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedState, setExpandedState] = useState<Record<number, boolean>>({});

  const toggleFolder = (id: number) => {
    setExpandedState(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isExpanded = (node: ProcessNode) => {
    return expandedState[node.id] ?? node.isExpanded ?? false;
  };

  const renderNode = (node: ProcessNode, level: number = 0) => {
    const selected = selectedId === node.id;
    const isFolder = node.type === 'macro' || (node.type === 'process' && node.children && node.children.length > 0);
    const hasChildren = node.children && node.children.length > 0;
    const nodeExpanded = isExpanded(node);

    return (
      <div key={node.id} className="w-full">
        <div 
          className={`
            flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer
            transition-colors duration-200 group
            ${selected 
              ? 'bg-accent text-accent-foreground font-medium' 
              : 'hover:bg-muted/50'
            }
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.id);
            } else {
              setSelectedId(node.id);
            }
          }}
        >
          {isFolder && hasChildren && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
            >
              {nodeExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {!hasChildren && <div className="w-4" />}
          
          {isFolder ? (
            nodeExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <FileText className="h-4 w-4 text-primary" />
          )}
          
          <span className="text-sm flex-1 truncate">{node.titulo}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Renomear</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {isFolder && nodeExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-4">Carregando árvore de processos...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive">Erro ao carregar hierarquia: {error.message}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Árvore de Processos</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {processes.map(process => renderNode(process))}
      </div>
    </div>
  );
};