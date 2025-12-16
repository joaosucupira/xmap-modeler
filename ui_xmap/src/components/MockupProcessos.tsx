import { useState, useEffect } from "react";
import { 
  ArrowRight,
  FileText,
  Settings,
  Loader2,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Mapa {
  id: number;
  id_proc: number;
  XML: string;
  titulo: string;
  status: string;
  data_criacao: string | null;
  data_modificacao: string | null;
}

interface Processo {
  id: number;
  titulo: string;
  data_publicacao: string;
}

const API_URL = "http://localhost:8000";

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Data não disponível';
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'concluído': return 'default';
    case 'em andamento': return 'secondary';
    case 'pendente': return 'destructive';
    default: return 'outline';
  }
};

export const MockupProcesso = () => {
  const [mapas, setMapas] = useState<Array<{
    id: number;
    name: string;
    lastModified: string;
    map_id: number;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  useEffect(() => {
    const fetchMapasEProcessos = async () => {
      try {
        // Fetch mapas
        const mapasResponse = await fetch(`${API_URL}/mapas/`);
        if (!mapasResponse.ok) throw new Error('Falha ao carregar mapas');
        const mapasData = await mapasResponse.json();

        // Fetch processos
        const processosResponse = await fetch(`${API_URL}/processos/`);
        if (!processosResponse.ok) throw new Error('Falha ao carregar processos');
        const processosData = await processosResponse.json();

        // Create a map of processo_id to processo
        const processosMap = new Map(
          processosData.processos.map((p: Processo) => [p.id, p])
        );

        // Combine mapa data with processo data
        const mappedData = mapasData.mapas.map((mapa: Mapa) => {
          const processo = processosMap.get(mapa.id_proc);
          return {
            id: mapa.id,
            name: mapa.titulo || processo?.titulo || `Processo ${mapa.id_proc}`,
            lastModified: formatDate(mapa.data_modificacao),
            map_id: mapa.id,
            status: mapa.status || 'Em andamento'
          };
        });

        setMapas(mappedData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchMapasEProcessos();
  }, []);

  const handleEditMap = (mapaId: number) => {
    window.open(`http://localhost:8080?mapa=${mapaId}&mode=edit`, '_blank');
  };

  const handleViewMap = (mapaId: number) => {
    window.open(`http://localhost:8080?mapa=${mapaId}&mode=view`, '_blank');
  };

  // Filtrar mapas pelo status
  const filteredMapas = statusFilter === "todos" 
    ? mapas 
    : mapas.filter(m => m.status.toLowerCase() === statusFilter.toLowerCase());

  // Obter lista única de status para o filtro
  const uniqueStatuses = [...new Set(mapas.map(m => m.status))];

  return (
    <div className="h-full flex flex-col bg-gradient-subtle">
      {/* Header */}
      <div className="p-6 bg-card border-b shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mapeamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie mapas de processos
            </p>
          </div>
          
          {/* Filtro por Status */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status.toLowerCase()}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Carregando processos...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm mt-2">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            {/* Contador de resultados */}
            <p className="text-sm text-muted-foreground mb-4">
              {filteredMapas.length} {filteredMapas.length === 1 ? 'mapa encontrado' : 'mapas encontrados'}
              {statusFilter !== "todos" && ` com status "${statusFilter}"`}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMapas.map((map) => (
                <Card key={map.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{map.name}</CardTitle>
                      </div>
                      <Badge variant={getStatusBadgeVariant(map.status)}>
                        {map.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Modificado {map.lastModified}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewMap(map.map_id)}
                        className="flex-1"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleEditMap(map.map_id)}
                        className="flex-1"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMapas.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum mapa encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter !== "todos" 
                ? `Não há mapas com status "${statusFilter}"`
                : "Não há mapas cadastrados"
              }
            </p>
            {statusFilter !== "todos" && (
              <Button 
                variant="outline" 
                onClick={() => setStatusFilter("todos")}
              >
                Limpar filtro
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};