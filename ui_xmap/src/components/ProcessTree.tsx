import { useState } from "react";
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Maximize2,
  MoreHorizontal,
  Trash2,
  Map,
  Eye,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProcessNode {
  id: number;
  titulo: string;
  type: 'macro' | 'process' | 'map';
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
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; node: ProcessNode | null }>({
    open: false,
    node: null,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation para deletar processo
  const deleteProcessMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:8000/processos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar processo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      toast({
        title: "Processo excluído",
        description: "O processo foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar macroprocesso
  const deleteMacroMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:8000/macroprocessos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar macroprocesso');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      toast({
        title: "Macroprocesso excluído",
        description: "O macroprocesso foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar mapa
  const deleteMapMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`http://localhost:8000/mapas/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao deletar mapa');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      toast({
        title: "Mapa excluído",
        description: "O mapa foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (node: ProcessNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog({ open: true, node });
  };

  const confirmDelete = () => {
    if (!deleteDialog.node) return;
    
    if (deleteDialog.node.type === 'macro') {
      deleteMacroMutation.mutate(deleteDialog.node.id);
    } else if (deleteDialog.node.type === 'process') {
      deleteProcessMutation.mutate(deleteDialog.node.id);
    } else if (deleteDialog.node.type === 'map') {
      deleteMapMutation.mutate(deleteDialog.node.id);
    }
    
    setDeleteDialog({ open: false, node: null });
  };

  const toggleFolder = (id: number) => {
    setExpandedState(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isExpanded = (node: ProcessNode) => {
    return expandedState[node.id] ?? node.isExpanded ?? false;
  };

  // Função para abrir mapa no editor
  const openMap = (mapId: number, mode: 'view' | 'edit' = 'view') => {
    window.open(`http://localhost:8080?mapa=${mapId}&mode=${mode}`, '_blank');
  };

  const isDeleting = deleteProcessMutation.isPending || deleteMacroMutation.isPending || deleteMapMutation.isPending;

  const renderNode = (node: ProcessNode, level: number = 0) => {
    const selected = selectedId === node.id;
    const isMap = node.type === 'map';
    const isFolder = node.type === 'macro' || (node.type === 'process' && node.children && node.children.length > 0);
    const hasChildren = node.children && node.children.length > 0;
    const nodeExpanded = isExpanded(node);

    // Ícone baseado no tipo
    const getIcon = () => {
      if (isMap) {
        return <Map className="h-4 w-4 text-emerald-500" />;
      }
      if (node.type === 'macro') {
        return nodeExpanded ? (
          <FolderOpen className="h-4 w-4 text-violet-500" />
        ) : (
          <Folder className="h-4 w-4 text-violet-500" />
        );
      }
      if (node.type === 'process') {
        if (hasChildren) {
          return nodeExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          );
        }
        return <FileText className="h-4 w-4 text-blue-500" />;
      }
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    };

    // Estilo do background baseado no tipo quando selecionado
    const getSelectedStyle = () => {
      if (!selected) return '';
      switch (node.type) {
        case 'macro':
          return 'bg-violet-100 dark:bg-violet-950/50 text-violet-900 dark:text-violet-100';
        case 'process':
          return 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100';
        case 'map':
          return 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100';
        default:
          return 'bg-accent text-accent-foreground';
      }
    };

    return (
      <div key={`${node.type}-${node.id}`} className="w-full">
        <div 
          className={`
            flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer
            transition-colors duration-200 group
            ${selected 
              ? `${getSelectedStyle()} font-medium` 
              : 'hover:bg-muted/50'
            }
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (isMap) {
              // Ao clicar em um mapa, abre na view
              openMap(node.id, 'view');
            } else if (isFolder) {
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
          
          {(!hasChildren || isMap) && <div className="w-4" />}
          
          {getIcon()}
          
          <span className="text-sm flex-1 truncate">{node.titulo}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isMap && (
                <>
                  <DropdownMenuItem onClick={() => openMap(node.id, 'view')}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openMap(node.id, 'edit')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!isMap && (
                <>
                  <DropdownMenuItem>Renomear</DropdownMenuItem>
                  <DropdownMenuItem>Duplicar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => handleDeleteClick(node, e)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0"
          onClick={() => window.open('/novo-processo', '_blank')}
          title="Criar novo processo"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {processes.map(process => renderNode(process))}
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => setDeleteDialog({ open, node: open ? deleteDialog.node : null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.node?.type === 'macro' ? (
                <>
                  Tem certeza que deseja excluir o macroprocesso <strong>"{deleteDialog.node?.titulo}"</strong>?
                  <br />
                  <span className="text-destructive">
                    Isso também excluirá todos os processos e mapas associados.
                  </span>
                </>
              ) : deleteDialog.node?.type === 'process' ? (
                <>
                  Tem certeza que deseja excluir o processo <strong>"{deleteDialog.node?.titulo}"</strong>?
                  <br />
                  <span className="text-destructive">
                    Isso também excluirá todos os mapas e metadados associados.
                  </span>
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir o mapa <strong>"{deleteDialog.node?.titulo}"</strong>?
                  <br />
                  <span className="text-destructive">
                    Esta ação não pode ser desfeita.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};