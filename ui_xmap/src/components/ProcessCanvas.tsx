import { useState, useEffect } from "react";
import { 
  ExternalLink,
  Plus,
  ArrowRight,
  FileText,
  Settings,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Mapa {
  id: number;
  id_proc: number;
  XML: string;
}

interface ProcessoMapa {
  id: number;
  name: string;
  lastModified: string;
  map_id: number;
}

const API_URL = "http://localhost:8000";

export const ProcessCanvas = () => {
  const navigate = useNavigate();
  const [mapas, setMapas] = useState<ProcessoMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mocked card that we'll keep
  const mockedMap = {
    id: 1,
    name: "Processo de Vendas (Demo)",
    lastModified: "Exemplo",
    map_id: 1
  };

  useEffect(() => {
    const fetchMapas = async () => {
      try {
        const response = await fetch(`${API_URL}/mapas/`);
        if (!response.ok) throw new Error('Falha ao carregar mapas');
        
        const data = await response.json();
        const processedMapas: ProcessoMapa[] = data.mapas.map((mapa: Mapa) => ({
          id: mapa.id,
          name: `Processo ${mapa.id}`,
          lastModified: new Date().toLocaleDateString('pt-BR'),
          map_id: mapa.id
        }));

        // Combine mocked map with real data
        setMapas([mockedMap, ...processedMapas]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar mapas');
      } finally {
        setLoading(false);
      }
    };

    fetchMapas();
  }, []);

  const handleNewProcess = () => {
    navigate("/novo-processo");
  };

  const handleEditMap = (mapaId: number) => {
    window.open(`http://localhost:8080?mapa=${mapaId}&mode=edit`, '_blank');
  };

  const handleViewMap = (mapaId: number) => {
    window.open(`http://localhost:8080?mapa=${mapaId}&mode=view`, '_blank');
  };

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
          <Button 
            onClick={handleNewProcess}
            className="flex items-center gap-2 bg-gradient-primary hover:bg-gradient-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Processo
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapas.map((map) => (
              <Card key={map.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{map.name}</CardTitle>
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
        )}

        {/* Empty State */}
        {!loading && !error && mapas.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum processo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro processo para começar
            </p>
            <Button onClick={handleNewProcess} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Processo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};