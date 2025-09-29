import { useState } from "react";
import { 
  ExternalLink,
  Plus,
  ArrowRight,
  FileText,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ProcessCanvas = () => {
  const [selectedMap, setSelectedMap] = useState<number | null>(null);

  const handleNewProcess = () => {
    // Abre o canvas externo em uma nova aba
    window.open('http://localhost:8080', '_blank');
  };

  const handleEditMap = (mapaId: number) => {
    window.open(`http://localhost:8080?mapa=${mapaId}&mode=edit`, '_blank');
  };

  const handleViewMap = (mapaId: number) => {
    window.open(`http://localhost:8080?mapa=${mapaId}&mode=view`, '_blank');
  };

  // Mock de mapas (substitua por dados reais da API)
  const mockMaps = [
    { id: 1, name: "Processo de Vendas", lastModified: "2 horas atrás" ,map_id:1},
    { id: 2, name: "Aprovação de Compras", lastModified: "1 dia atrás" ,map_id:2},
    { id: 3, name: "Gestão de Leads", lastModified: "3 dias atrás" ,map_id:3},
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockMaps.map((map) => (
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
                    onClick={() => handleViewMap(map.id)}
                    className="flex-1"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleEditMap(map.id)}
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

        {/* Empty State */}
        {mockMaps.length === 0 && (
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