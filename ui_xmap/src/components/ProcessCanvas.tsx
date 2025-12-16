// ProcessCanvas.tsx with move functionality and tree-matching color scheme
// MacroProcesso: violet/purple (violeta/roxo)
// Processo: blue/cyan (azul/ciano)
// Mapa: emerald/teal (verde/turquesa)

import { useState } from "react";
import { 
  Plus,
  FileText,
  Loader2,
  Trash2,
  MoreVertical,
  Edit,
  AlertTriangle,
  Folder,
  Map,
  ChevronDown,
  ChevronRight,
  Eye,
  Layers,
  Move,
  MoveRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProcessNode {
  id: number;
  titulo: string;
  type: 'macro' | 'process' | 'map';
  children?: ProcessNode[];
  proc_id?: number;
  data_criacao?: string;
}

const API_URL = "http://localhost:8000";

const fetchHierarchy = async (): Promise<ProcessNode[]> => {
  const response = await fetch(`${API_URL}/hierarchy/`);
  if (!response.ok) {
    throw new Error('Failed to fetch hierarchy');
  }
  const data = await response.json();
  return data.hierarchy;
};

const createMacroProcesso = async (titulo: string) => {
  const response = await fetch(`${API_URL}/macroprocessos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo }),
  });
  if (!response.ok) throw new Error('Failed to create macroprocesso');
  return response.json();
};

const deleteMacroProcesso = async (macroId: number) => {
  const response = await fetch(`${API_URL}/macroprocessos/${macroId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete macroprocesso');
  return response.json();
};

const createProcess = async ({ titulo, id_pai, ordem }: { titulo: string; id_pai?: number; ordem?: number }) => {
  const body: any = { titulo };
  if (id_pai !== undefined) body.id_pai = id_pai;
  if (ordem !== undefined) body.ordem = ordem;
  const response = await fetch(`${API_URL}/processos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to create process');
  return response.json();
};

const deleteProcess = async (processId: number) => {
  const response = await fetch(`${API_URL}/processos/${processId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete process');
  return response.json();
};

const createAssociation = async ({ macro_processo_id, processo_id, ordem }: { macro_processo_id: number; processo_id: number; ordem?: number }) => {
  const body: any = { macro_processo_id, processo_id };
  if (ordem !== undefined) body.ordem = ordem;
  const response = await fetch(`${API_URL}/macroprocesso_processos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to create association');
  return response.json();
};

const createMap = async ({ id_proc, titulo, XML }: { id_proc: number; titulo: string; XML: string }) => {
  const response = await fetch(`${API_URL}/mapas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_proc, titulo, XML }),
  });
  if (!response.ok) throw new Error('Failed to create map');
  return response.json();
};

const deleteMap = async (mapId: number) => {
  const response = await fetch(`${API_URL}/mapas/${mapId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete map');
  return response.json();
};

const moveProcess = async ({ processId, targetMacroId, targetProcessoId }: { 
  processId: number; 
  targetMacroId?: number; 
  targetProcessoId?: number 
}) => {
  const response = await fetch(`${API_URL}/processos/${processId}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      target_macro_id: targetMacroId, 
      target_processo_id: targetProcessoId 
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to move process');
  }
  return response.json();
};

const moveMap = async ({ mapId, targetProcessoId }: { mapId: number; targetProcessoId: number }) => {
  const response = await fetch(`${API_URL}/mapas/${mapId}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_processo_id: targetProcessoId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to move map');
  }
  return response.json();
};

// Helper para extrair todos os processos da hierarquia
const getAllProcesses = (hierarchy: ProcessNode[]): { id: number; titulo: string; macroTitulo: string }[] => {
  const processes: { id: number; titulo: string; macroTitulo: string }[] = [];
  
  const traverse = (node: ProcessNode, macroTitulo: string) => {
    if (node.type === 'process') {
      processes.push({ id: node.id, titulo: node.titulo, macroTitulo });
      node.children?.forEach(child => traverse(child, macroTitulo));
    }
  };
  
  hierarchy.forEach(macro => {
    macro.children?.forEach(child => traverse(child, macro.titulo));
  });
  
  return processes;
};

// Componente para Mapa - EMERALD/TEAL (verde/turquesa)
interface MapItemProps {
  map: ProcessNode;
  onDelete: () => void;
  onMove: () => void;
  formatDate: (dateStr: string) => string;
}

const MapItem: React.FC<MapItemProps> = ({ map, onDelete, onMove, formatDate }) => {
  const handleView = () => window.open(`http://localhost:8080?mapa=${map.id}&mode=view`, '_blank');
  const handleEdit = () => window.open(`http://localhost:8080?mapa=${map.id}&mode=edit`, '_blank');

  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all">
      <div className="p-2 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <Map className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{map.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {map.data_criacao ? formatDate(map.data_criacao) : 'Data não disponível'}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-100 dark:hover:bg-emerald-900" onClick={handleView} title="Visualizar">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-100 dark:hover:bg-emerald-900" onClick={handleEdit} title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-100 dark:hover:bg-emerald-900" onClick={onMove} title="Mover mapa">
          <MoveRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-100 dark:hover:bg-red-900" onClick={onDelete} title="Excluir">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente para Processo - BLUE/CYAN (azul/ciano)
interface ProcessItemProps {
  process: ProcessNode;
  onAddMap: (procId: number) => void;
  onAddSubProcess: (parentId: number) => void;
  onDeleteProcess: (id: number, titulo: string) => void;
  onDeleteMap: (id: number, titulo: string) => void;
  onMoveProcess: (id: number, titulo: string) => void;
  onMoveMap: (id: number, titulo: string) => void;
  formatDate: (dateStr: string) => string;
}

const ProcessItem: React.FC<ProcessItemProps> = ({ 
  process, 
  onAddMap, 
  onAddSubProcess, 
  onDeleteProcess, 
  onDeleteMap,
  onMoveProcess,
  onMoveMap,
  formatDate 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const maps = process.children?.filter(c => c.type === 'map') || [];
  const subProcesses = process.children?.filter(c => c.type === 'process') || [];
  const hasChildren = maps.length > 0 || subProcesses.length > 0;

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <div className="p-2 rounded-md bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <FileText className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{process.titulo}</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Processo
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {maps.length > 0 && <span>{maps.length} mapa{maps.length > 1 ? 's' : ''}</span>}
              {subProcesses.length > 0 && <span>{subProcesses.length} subprocesso{subProcesses.length > 1 ? 's' : ''}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950" onClick={() => onAddMap(process.id)}>
              <Map className="h-3 w-3 mr-1" />
              Mapa
            </Button>
            <Button variant="outline" size="sm" className="h-8 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950" onClick={() => onAddSubProcess(process.id)}>
              <Plus className="h-3 w-3 mr-1" />
              Sub
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMoveProcess(process.id, process.titulo)}>
                  <Move className="h-4 w-4 mr-2" />
                  Mover Processo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteProcess(process.id, process.titulo)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Processo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Mapas */}
            {maps.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <Map className="h-4 w-4" />
                  Mapas ({maps.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                  {maps.map(map => (
                    <MapItem 
                      key={map.id} 
                      map={map} 
                      onDelete={() => onDeleteMap(map.id, map.titulo)}
                      onMove={() => onMoveMap(map.id, map.titulo)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Subprocessos */}
            {subProcesses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                  <Layers className="h-4 w-4" />
                  Subprocessos ({subProcesses.length})
                </div>
                <div className="space-y-3 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                  {subProcesses.map(sub => (
                    <ProcessItem
                      key={sub.id}
                      process={sub}
                      onAddMap={onAddMap}
                      onAddSubProcess={onAddSubProcess}
                      onDeleteProcess={onDeleteProcess}
                      onDeleteMap={onDeleteMap}
                      onMoveProcess={onMoveProcess}
                      onMoveMap={onMoveMap}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {!hasChildren && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum mapa ou subprocesso. Clique nos botões acima para adicionar.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Componente para MacroProcesso - VIOLET/PURPLE (violeta/roxo)
interface MacroProcessCardProps {
  macro: ProcessNode;
  onAddProcess: (macroId: number) => void;
  onDeleteMacro: (id: number, titulo: string) => void;
  onAddMap: (procId: number) => void;
  onAddSubProcess: (parentId: number) => void;
  onDeleteProcess: (id: number, titulo: string) => void;
  onDeleteMap: (id: number, titulo: string) => void;
  onMoveProcess: (id: number, titulo: string) => void;
  onMoveMap: (id: number, titulo: string) => void;
  formatDate: (dateStr: string) => string;
}

const MacroProcessCard: React.FC<MacroProcessCardProps> = ({
  macro,
  onAddProcess,
  onDeleteMacro,
  onAddMap,
  onAddSubProcess,
  onDeleteProcess,
  onDeleteMap,
  onMoveProcess,
  onMoveMap,
  formatDate
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const processes = macro.children?.filter(c => c.type === 'process') || [];

  return (
    <Card className="overflow-hidden border-2 border-violet-300 dark:border-purple-700 shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                  {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
              <div className="p-2 rounded-md bg-white/20">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">{macro.titulo}</CardTitle>
                <CardDescription className="text-violet-200">
                  MacroProcesso • {processes.length} processo{processes.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => onAddProcess(macro.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Processo
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onDeleteMacro(macro.id, macro.titulo)} 
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir MacroProcesso
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="p-6 bg-violet-50 dark:bg-purple-950/20">
            {processes.length > 0 ? (
              <div className="space-y-4">
                {processes.map(process => (
                  <ProcessItem
                    key={process.id}
                    process={process}
                    onAddMap={onAddMap}
                    onAddSubProcess={onAddSubProcess}
                    onDeleteProcess={onDeleteProcess}
                    onDeleteMap={onDeleteMap}
                    onMoveProcess={onMoveProcess}
                    onMoveMap={onMoveMap}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-violet-300 dark:text-purple-700 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  Nenhum processo neste macroprocesso
                </p>
                <Button variant="outline" onClick={() => onAddProcess(macro.id)} className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Processo
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export const ProcessCanvas = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Dialog states
  const [isMacroDialogOpen, setIsMacroDialogOpen] = useState(false);
  const [macroTitulo, setMacroTitulo] = useState('');
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processTitulo, setProcessTitulo] = useState('');
  const [processOrdem, setProcessOrdem] = useState('');
  const [processParentId, setProcessParentId] = useState<number | null>(null);
  const [processParentType, setProcessParentType] = useState<'macro' | 'process' | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapTitulo, setMapTitulo] = useState('');
  const [mapProcId, setMapProcId] = useState<number | null>(null);
  
  // Delete dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'macro' | 'process' | 'map';
    id: number;
    titulo: string;
  } | null>(null);

  // Move dialog states
  const [moveProcessDialog, setMoveProcessDialog] = useState<{
    isOpen: boolean;
    processId: number;
    titulo: string;
  } | null>(null);
  
  const [moveMapDialog, setMoveMapDialog] = useState<{
    isOpen: boolean;
    mapId: number;
    titulo: string;
  } | null>(null);
  
  const [selectedMoveTarget, setSelectedMoveTarget] = useState<string>('');

  const { data: hierarchy = [], isLoading } = useQuery<ProcessNode[]>({
    queryKey: ['hierarchy'],
    queryFn: fetchHierarchy,
  });

  // Mutations
  const macroMutation = useMutation({
    mutationFn: createMacroProcesso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      setIsMacroDialogOpen(false);
      setMacroTitulo('');
      toast({ title: "Sucesso", description: "MacroProcesso criado com sucesso!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao criar MacroProcesso." });
    },
  });

  const processMutation = useMutation({
    mutationFn: createProcess,
    onSuccess: (data) => {
      if (processParentType === 'macro') {
        associationMutation.mutate({ 
          macro_processo_id: processParentId!, 
          processo_id: data.processo.id, 
          ordem: processOrdem ? parseInt(processOrdem) : undefined 
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
        toast({ title: "Sucesso", description: "Processo criado com sucesso!" });
      }
      setIsProcessDialogOpen(false);
      setProcessTitulo('');
      setProcessOrdem('');
      setProcessParentId(null);
      setProcessParentType(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao criar Processo." });
    },
  });

  const associationMutation = useMutation({
    mutationFn: createAssociation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      toast({ title: "Sucesso", description: "Processo associado com sucesso!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao criar associação." });
    },
  });

  const mapMutation = useMutation({
    mutationFn: createMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      setIsMapDialogOpen(false);
      setMapTitulo('');
      setMapProcId(null);
      toast({ title: "Sucesso", description: "Mapa criado com sucesso!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao criar Mapa." });
    },
  });

  const deleteMacroMutation = useMutation({
    mutationFn: deleteMacroProcesso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      setDeleteDialog(null);
      toast({ title: "Sucesso", description: "MacroProcesso excluído com sucesso!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao excluir MacroProcesso." });
    },
  });

  const deleteProcessMutation = useMutation({
    mutationFn: deleteProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      setDeleteDialog(null);
      toast({ title: "Sucesso", description: "Processo excluído com sucesso!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao excluir Processo." });
    },
  });

  const deleteMapMutation = useMutation({
    mutationFn: deleteMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      setDeleteDialog(null);
      toast({ title: "Sucesso", description: "Mapa excluído com sucesso!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao excluir Mapa." });
    },
  });

  const moveProcessMutation = useMutation({
    mutationFn: moveProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      setMoveProcessDialog(null);
      setSelectedMoveTarget('');
      toast({ title: "Sucesso", description: "Processo movido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Falha ao mover processo." });
    },
  });

  const moveMapMutation = useMutation({
    mutationFn: moveMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
      setMoveMapDialog(null);
      setSelectedMoveTarget('');
      toast({ title: "Sucesso", description: "Mapa movido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Falha ao mover mapa." });
    },
  });

  // Handlers
  const handleMacroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (macroTitulo.trim()) {
      macroMutation.mutate(macroTitulo);
    }
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (processTitulo.trim()) {
      processMutation.mutate({ 
        titulo: processTitulo, 
        id_pai: processParentType === 'process' ? processParentId! : undefined, 
        ordem: processOrdem ? parseInt(processOrdem) : undefined 
      });
    }
  };

  const handleMapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapTitulo.trim() && mapProcId !== null) {
      const defaultXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1gghy4b" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.9.0">
  <bpmn:collaboration id="Collaboration_0te0omg">
    <bpmn:participant id="Participant_0snu5vh" processRef="Process_0sm7z4l" />
  </bpmn:collaboration>
  <bpmn:process id="Process_0sm7z4l" isExecutable="false">
    <bpmn:startEvent id="StartEvent_129t7pc" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_0te0omg">
      <bpmndi:BPMNShape id="Participant_0snu5vh_di" bpmnElement="Participant_0snu5vh" isHorizontal="true">
        <dc:Bounds x="160" y="40" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_129t7pc">
        <dc:Bounds x="266" y="112" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
      mapMutation.mutate({ id_proc: mapProcId, titulo: mapTitulo, XML: defaultXML });
    }
  };

  const handleAddProcessToMacro = (macroId: number) => {
    setProcessParentId(macroId);
    setProcessParentType('macro');
    setIsProcessDialogOpen(true);
  };

  const handleAddSubProcess = (parentId: number) => {
    setProcessParentId(parentId);
    setProcessParentType('process');
    setIsProcessDialogOpen(true);
  };

  const handleAddMap = (procId: number) => {
    setMapProcId(procId);
    setIsMapDialogOpen(true);
  };

  const handleDeleteMacro = (macroId: number, titulo: string) => {
    setDeleteDialog({ isOpen: true, type: 'macro', id: macroId, titulo });
  };

  const handleDeleteProcess = (processId: number, titulo: string) => {
    setDeleteDialog({ isOpen: true, type: 'process', id: processId, titulo });
  };

  const handleDeleteMap = (mapId: number, titulo: string) => {
    setDeleteDialog({ isOpen: true, type: 'map', id: mapId, titulo });
  };

  const handleMoveProcess = (processId: number, titulo: string) => {
    setMoveProcessDialog({ isOpen: true, processId, titulo });
    setSelectedMoveTarget('');
  };

  const handleMoveMap = (mapId: number, titulo: string) => {
    setMoveMapDialog({ isOpen: true, mapId, titulo });
    setSelectedMoveTarget('');
  };

  const confirmDelete = () => {
    if (!deleteDialog) return;
    switch (deleteDialog.type) {
      case 'macro': deleteMacroMutation.mutate(deleteDialog.id); break;
      case 'process': deleteProcessMutation.mutate(deleteDialog.id); break;
      case 'map': deleteMapMutation.mutate(deleteDialog.id); break;
    }
  };

  const confirmMoveProcess = () => {
    if (!moveProcessDialog || !selectedMoveTarget) return;
    
    const [type, id] = selectedMoveTarget.split('-');
    
    if (type === 'macro') {
      moveProcessMutation.mutate({
        processId: moveProcessDialog.processId,
        targetMacroId: parseInt(id)
      });
    } else if (type === 'process') {
      moveProcessMutation.mutate({
        processId: moveProcessDialog.processId,
        targetProcessoId: parseInt(id)
      });
    }
  };

  const confirmMoveMap = () => {
    if (!moveMapDialog || !selectedMoveTarget) return;
    
    const processId = parseInt(selectedMoveTarget);
    moveMapMutation.mutate({
      mapId: moveMapDialog.mapId,
      targetProcessoId: processId
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeleting = deleteMacroMutation.isPending || deleteProcessMutation.isPending || deleteMapMutation.isPending;
  const isMoving = moveProcessMutation.isPending || moveMapMutation.isPending;

  // Helper para obter todos os processos para seleção
  const allProcesses = getAllProcesses(hierarchy);

  // Stats
  const totalMacros = hierarchy.length;
  const totalProcesses = hierarchy.reduce((acc, m) => acc + (m.children?.filter(c => c.type === 'process').length || 0), 0);
  const totalMaps = hierarchy.reduce((acc, m) => {
    let count = 0;
    const countMaps = (node: ProcessNode) => {
      node.children?.forEach(c => {
        if (c.type === 'map') count++;
        else countMaps(c);
      });
    };
    countMaps(m);
    return acc + count;
  }, 0);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Canvas de Processos
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize e gerencie sua hierarquia de processos
            </p>
          </div>
          <Dialog open={isMacroDialogOpen} onOpenChange={setIsMacroDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo MacroProcesso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo MacroProcesso</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMacroSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="macro-titulo">Título</Label>
                  <Input 
                    id="macro-titulo" 
                    value={macroTitulo} 
                    onChange={(e) => setMacroTitulo(e.target.value)} 
                    placeholder="Ex: Gestão de Pessoas" 
                    required 
                  />
                </div>
                <Button type="submit" disabled={macroMutation.isPending} className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                  {macroMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {macroMutation.isPending ? 'Criando...' : 'Criar MacroProcesso'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-gradient-to-br from-violet-500 to-purple-600">
              <Folder className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm">
              <strong>{totalMacros}</strong> MacroProcesso{totalMacros !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-gradient-to-br from-blue-500 to-cyan-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm">
              <strong>{totalProcesses}</strong> Processo{totalProcesses !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-gradient-to-br from-emerald-500 to-teal-600">
              <Map className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm">
              <strong>{totalMaps}</strong> Mapa{totalMaps !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : hierarchy.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
              <Folder className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum macroprocesso encontrado</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Comece criando seu primeiro macroprocesso para organizar seus processos de negócio.
            </p>
            <Button onClick={() => setIsMacroDialogOpen(true)} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro MacroProcesso
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {hierarchy.map((macro) => (
              <MacroProcessCard
                key={macro.id}
                macro={macro}
                onAddProcess={handleAddProcessToMacro}
                onDeleteMacro={handleDeleteMacro}
                onAddMap={handleAddMap}
                onAddSubProcess={handleAddSubProcess}
                onDeleteProcess={handleDeleteProcess}
                onDeleteMap={handleDeleteMap}
                onMoveProcess={handleMoveProcess}
                onMoveMap={handleMoveMap}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processParentType === 'macro' ? 'Criar Novo Processo' : 'Criar Subprocesso'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProcessSubmit} className="space-y-4">
            <div>
              <Label htmlFor="process-titulo">Título</Label>
              <Input 
                id="process-titulo" 
                value={processTitulo} 
                onChange={(e) => setProcessTitulo(e.target.value)} 
                placeholder="Ex: Recrutamento e Seleção" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="process-ordem">Ordem (opcional)</Label>
              <Input 
                id="process-ordem" 
                type="number"
                value={processOrdem} 
                onChange={(e) => setProcessOrdem(e.target.value)} 
                placeholder="1, 2, 3..." 
              />
            </div>
            <Button type="submit" disabled={processMutation.isPending || associationMutation.isPending} className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
              {(processMutation.isPending || associationMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {(processMutation.isPending || associationMutation.isPending) ? 'Criando...' : 'Criar Processo'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Mapa BPMN</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMapSubmit} className="space-y-4">
            <div>
              <Label htmlFor="map-titulo">Título do Mapa</Label>
              <Input 
                id="map-titulo" 
                value={mapTitulo} 
                onChange={(e) => setMapTitulo(e.target.value)} 
                placeholder="Ex: Fluxo de Contratação" 
                required 
              />
            </div>
            <Button type="submit" disabled={mapMutation.isPending} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {mapMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Map className="h-4 w-4 mr-2" />
              )}
              {mapMutation.isPending ? 'Criando...' : 'Criar Mapa'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog?.isOpen} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>"{deleteDialog?.titulo}"</strong>?
              {deleteDialog?.type === 'macro' && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Isso excluirá todos os processos e mapas associados.
                </span>
              )}
              {deleteDialog?.type === 'process' && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Isso excluirá todos os subprocessos e mapas associados.
                </span>
              )}
              <span className="block mt-2 text-sm">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Process Dialog */}
      <Dialog open={moveProcessDialog?.isOpen} onOpenChange={(open) => !open && setMoveProcessDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="h-5 w-5 text-blue-500" />
              Mover Processo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Movendo: <strong>"{moveProcessDialog?.titulo}"</strong>
            </p>
            <div className="space-y-2">
              <Label>Selecione o destino</Label>
              <Select value={selectedMoveTarget} onValueChange={setSelectedMoveTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um destino..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-72">
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-violet-500" />
                        MacroProcessos
                      </SelectLabel>
                      {hierarchy.map(macro => (
                        <SelectItem key={`macro-${macro.id}`} value={`macro-${macro.id}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-purple-600" />
                            {macro.titulo}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Processos (como subprocesso)
                      </SelectLabel>
                      {allProcesses
                        .filter(p => p.id !== moveProcessDialog?.processId)
                        .map(proc => (
                          <SelectItem key={`process-${proc.id}`} value={`process-${proc.id}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600" />
                              <span>{proc.titulo}</span>
                              <span className="text-xs text-muted-foreground">({proc.macroTitulo})</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMoveProcessDialog(null)} disabled={isMoving}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmMoveProcess} 
              disabled={!selectedMoveTarget || isMoving}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
            >
              {isMoving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MoveRight className="h-4 w-4 mr-2" />}
              {isMoving ? 'Movendo...' : 'Mover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Map Dialog */}
      <Dialog open={moveMapDialog?.isOpen} onOpenChange={(open) => !open && setMoveMapDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="h-5 w-5 text-emerald-500" />
              Mover Mapa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Movendo: <strong>"{moveMapDialog?.titulo}"</strong>
            </p>
            <div className="space-y-2">
              <Label>Selecione o processo de destino</Label>
              <Select value={selectedMoveTarget} onValueChange={setSelectedMoveTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um processo..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-72">
                    {hierarchy.map(macro => (
                      <SelectGroup key={macro.id}>
                        <SelectLabel className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                          <Folder className="h-4 w-4" />
                          {macro.titulo}
                        </SelectLabel>
                        {allProcesses
                          .filter(p => p.macroTitulo === macro.titulo)
                          .map(proc => (
                            <SelectItem key={proc.id} value={proc.id.toString()}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                {proc.titulo}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMoveMapDialog(null)} disabled={isMoving}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmMoveMap} 
              disabled={!selectedMoveTarget || isMoving}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isMoving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MoveRight className="h-4 w-4 mr-2" />}
              {isMoving ? 'Movendo...' : 'Mover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};