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

interface ProcessNode {
  id: string;
  name: string;
  type: 'folder' | 'process';
  children?: ProcessNode[];
  isExpanded?: boolean;
}

const mockProcesses: ProcessNode[] = [
  {
    id: '1',
    name: 'Processos de Vendas',
    type: 'folder',
    isExpanded: true,
    children: [
      { id: '1-1', name: 'Prospecção de Clientes', type: 'process' },
      { id: '1-2', name: 'Negociação', type: 'process' },
      { id: '1-3', name: 'Fechamento', type: 'process' },
    ]
  },
  {
    id: '2',
    name: 'Processos de RH',
    type: 'folder',
    isExpanded: false,
    children: [
      { id: '2-1', name: 'Recrutamento', type: 'process' },
      { id: '2-2', name: 'Onboarding', type: 'process' },
    ]
  },
  {
    id: '3',
    name: 'Processo de Compras',
    type: 'process'
  }
];

export const ProcessTree = () => {
  const [processes, setProcesses] = useState<ProcessNode[]>(mockProcesses);
  const [selectedId, setSelectedId] = useState<string | null>('1-1');

  const toggleFolder = (id: string) => {
    setProcesses(prev => prev.map(process => 
      process.id === id 
        ? { ...process, isExpanded: !process.isExpanded }
        : process
    ));
  };

  const renderNode = (node: ProcessNode, level: number = 0) => {
    const isSelected = selectedId === node.id;
    const isFolder = node.type === 'folder';
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="w-full">
        <div 
          className={`
            flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer
            transition-colors duration-200 group
            ${isSelected 
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
              {node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {!hasChildren && <div className="w-4" />}
          
          {isFolder ? (
            node.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <FileText className="h-4 w-4 text-primary" />
          )}
          
          <span className="text-sm flex-1 truncate">{node.name}</span>
          
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
        
        {isFolder && node.isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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