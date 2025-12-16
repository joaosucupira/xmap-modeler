// Updated ProcessCanvas.tsx with delete functionality

import { useState } from "react";
import { 
  ExternalLink,
  Plus,
  ArrowRight,
  FileText,
  Settings,
  Loader2,
  Trash2,
  MoreVertical,
  Edit,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ProcessNode {
  id: number;
  titulo: string;
  type: 'macro' | 'process' | 'map';
  children?: ProcessNode[];
  proc_id?: number;
  data_criacao?: string;
}

interface ProcessMap {
  id: number;
  map_id: number;
  titulo: string;
  data_criacao: string;
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

interface MapCardProps {
  map: ProcessMap;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatLastModified: (dateStr: string) => string;
}

const MapCard: React.FC<MapCardProps> = ({ map, onView, onEdit, onDelete, formatLastModified }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{map.titulo}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardDescription>
        Modificado {formatLastModified(map.data_criacao)}
      </CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onView} className="flex-1">
          <ArrowRight className="h-3 w-3 mr-1" />
          Visualizar
        </Button>
        <Button variant="default" size="sm" onClick={onEdit} className="flex-1">
          <Settings className="h-3 w-3 mr-1" />
          Editar
        </Button>
      </div>
    </CardContent>
  </Card>
);

interface ProcessSectionProps {
  node: ProcessNode;
  level: number;
  formatLastModified: (dateStr: string) => string;
  onAddProcess: (parentId: number, parentType: 'macro' | 'process') => void;
  onAddMap: (procId: number) => void;
  onDeleteProcess: (processId: number, titulo: string) => void;
  onDeleteMap: (mapId: number, titulo: string) => void;
}

const ProcessSection: React.FC<ProcessSectionProps> = ({ 
  node, 
  level, 
  formatLastModified, 
  onAddProcess, 
  onAddMap,
  onDeleteProcess,
  onDeleteMap
}) => {
  const maps: ProcessMap[] = [];
  const subProcesses: ProcessNode[] = [];

  if (node.children) {
    node.children.forEach(child => {
      if (child.type === 'map') {
        maps.push({
          id: child.proc_id!,
          map_id: child.id,
          titulo: child.titulo,
          data_criacao: child.data_criacao || new Date().toISOString(),
        });
      } else if (child.type === 'process') {
        subProcesses.push(child);
      }
    });
  }

  const handleViewMap = (mapId: number) => {
    window.open(`http://localhost:8080?mapa=${mapId}&mode=view`, '_blank');
  };

  const handleEditMap = (mapId: number) => {
    window.open(`http://localhost:8080?mapa=${mapId}&mode=edit`, '_blank');
  };

  return (
    <div className={`space-y-4 ${level > 1 ? 'pl-6 border-l-2 border-muted' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{node.titulo}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onAddMap(node.id)}>
            <Plus className="h-4 w-4 mr-1" />
            Mapa
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAddProcess(node.id, 'process')}>
            <Plus className="h-4 w-4 mr-1" />
            Processo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDeleteProcess(node.id, node.titulo)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Processo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {maps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map(map => (
            <MapCard 
              key={map.map_id} 
              map={map} 
              onView={() => handleViewMap(map.map_id)} 
              onEdit={() => handleEditMap(map.map_id)} 
              onDelete={() => onDeleteMap(map.map_id, map.titulo)}
              formatLastModified={formatLastModified} 
            />
          ))}
        </div>
      )}
      
      {subProcesses.map(sub => (
        <ProcessSection 
          key={sub.id} 
          node={sub} 
          level={level + 1} 
          formatLastModified={formatLastModified} 
          onAddProcess={onAddProcess} 
          onAddMap={onAddMap}
          onDeleteProcess={onDeleteProcess}
          onDeleteMap={onDeleteMap}
        />
      ))}
      
      {maps.length === 0 && subProcesses.length === 0 && (
        <p className="text-muted-foreground text-center py-4 text-sm">
          Nenhum mapa ou subprocesso ainda.
        </p>
      )}
    </div>
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

  const { data: hierarchy = [], isLoading } = useQuery<ProcessNode[]>({
    queryKey: ['hierarchy'],
    queryFn: fetchHierarchy,
  });

  // Create mutations
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

  // Delete mutations
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

  const handleAddProcess = (parentId: number, parentType: 'macro' | 'process') => {
    setProcessParentId(parentId);
    setProcessParentType(parentType);
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

  const confirmDelete = () => {
    if (!deleteDialog) return;
    
    switch (deleteDialog.type) {
      case 'macro':
        deleteMacroMutation.mutate(deleteDialog.id);
        break;
      case 'process':
        deleteProcessMutation.mutate(deleteDialog.id);
        break;
      case 'map':
        deleteMapMutation.mutate(deleteDialog.id);
        break;
    }
  };

  const formatLastModified = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours} horas atrás`;
    return `${Math.floor(diffHours / 24)} dias atrás`;
  };

  const isDeleting = deleteMacroMutation.isPending || deleteProcessMutation.isPending || deleteMapMutation.isPending;

  return (
    <div className="h-full flex flex-col bg-gradient-subtle">
      {/* Header */}
      <div className="p-6 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Canvas de Modelagem
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie e edite diagramas de processo BPMN
            </p>
          </div>
          <Dialog open={isMacroDialogOpen} onOpenChange={setIsMacroDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-primary hover:bg-gradient-primary/90">
                <Plus className="h-4 w-4" />
                Novo Macro Processo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Macro Processo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleMacroSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="macro-titulo">Título</Label>
                  <Input 
                    id="macro-titulo" 
                    value={macroTitulo} 
                    onChange={(e) => setMacroTitulo(e.target.value)} 
                    placeholder="Digite o título do Macro Processo" 
                    required 
                  />
                </div>
                <Button type="submit" disabled={macroMutation.isPending}>
                  {macroMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hierarchy.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum macroprocesso encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro macroprocesso para começar
            </p>
            <Button onClick={() => setIsMacroDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Macro Processo
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {hierarchy.map((macro) => (
              <Card key={macro.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{macro.titulo}</CardTitle>
                      <CardDescription>Macro Processo</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAddProcess(macro.id, 'macro')}>
                        <Plus className="h-4 w-4 mr-1" />
                        Processo
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMacro(macro.id, macro.titulo)} 
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Macro Processo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {macro.children && macro.children.length > 0 ? (
                    <div className="space-y-6">
                      {macro.children.map(child => (
                        <ProcessSection 
                          key={child.id} 
                          node={child} 
                          level={1} 
                          formatLastModified={formatLastModified} 
                          onAddProcess={handleAddProcess} 
                          onAddMap={handleAddMap}
                          onDeleteProcess={handleDeleteProcess}
                          onDeleteMap={handleDeleteMap}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum processo neste macroprocesso ainda.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Processo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProcessSubmit} className="space-y-4">
            <div>
              <Label htmlFor="process-titulo">Título</Label>
              <Input 
                id="process-titulo" 
                value={processTitulo} 
                onChange={(e) => setProcessTitulo(e.target.value)} 
                placeholder="Digite o título do Processo" 
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
                placeholder="Ordem" 
              />
            </div>
            <Button type="submit" disabled={processMutation.isPending || associationMutation.isPending}>
              {processMutation.isPending || associationMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Mapa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMapSubmit} className="space-y-4">
            <div>
              <Label htmlFor="map-titulo">Título</Label>
              <Input 
                id="map-titulo" 
                value={mapTitulo} 
                onChange={(e) => setMapTitulo(e.target.value)} 
                placeholder="Digite o título do Mapa" 
                required 
              />
            </div>
            <Button type="submit" disabled={mapMutation.isPending}>
              {mapMutation.isPending ? 'Criando...' : 'Salvar'}
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
              Tem certeza que deseja excluir{' '}
              <strong>"{deleteDialog?.titulo}"</strong>?
              {deleteDialog?.type === 'macro' && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Isso pode afetar os processos associados a este macroprocesso.
                </span>
              )}
              {deleteDialog?.type === 'process' && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Isso pode afetar os subprocessos e mapas associados.
                </span>
              )}
              <span className="block mt-2">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};