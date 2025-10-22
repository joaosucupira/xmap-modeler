import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Database, Paperclip, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Metadado {
  id: number;
  nome: string;
  dados: string[];
  lgpd: string;
  id_atividade: string;
}

interface Documento {
  id: number;
  nome: string;
  url: string;
  tipo: string;
  tamanho: string;
  data_upload: string;
}

interface ProcessViewerProps {
  processoId: number;
  onClose?: () => void;
}

const API_URL = "http://localhost:8000";

export const ProcessViewer = ({ processoId, onClose }: ProcessViewerProps) => {
  const [metadados, setMetadados] = useState<Metadado[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("metadados");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch metadados do processo
        const metadadosResponse = await fetch(`${API_URL}/metadados/processo/${processoId}`);
        if (metadadosResponse.ok) {
          const metadadosData = await metadadosResponse.json();
          setMetadados(metadadosData.metadados || []);
        }

        // Fetch documentos do processo
        const documentosResponse = await fetch(`${API_URL}/documentos/processo/${processoId}`);
        if (documentosResponse.ok) {
          const documentosData = await documentosResponse.json();
          setDocumentos(documentosData.documentos || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [processoId]);

  const getLgpdBadgeVariant = (lgpd: string) => {
    switch (lgpd.toLowerCase()) {
      case 'public': return 'default';
      case 'confidential': return 'secondary';
      case 'anonymized': return 'outline';
      default: return 'destructive';
    }
  };

  const handleDownload = (documento: Documento) => {
    window.open(documento.url, '_blank');
  };

  const handleViewDocument = (documento: Documento) => {
    window.open(documento.url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metadados" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Metadados ({metadados.length})
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Anexos ({documentos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metadados" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Metadados do Processo
              </CardTitle>
              <CardDescription>
                Informações sobre os dados processados e classificação LGPD
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metadados.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Atividade</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Dados</TableHead>
                        <TableHead>Classificação LGPD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metadados.map((metadado) => (
                        <TableRow key={metadado.id}>
                          <TableCell className="font-mono text-sm">
                            {metadado.id_atividade}
                          </TableCell>
                          <TableCell className="font-medium">
                            {metadado.nome}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {metadado.dados.map((dado, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {dado}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getLgpdBadgeVariant(metadado.lgpd)}>
                              {metadado.lgpd}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum metadado encontrado para este processo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Documentos Anexados
              </CardTitle>
              <CardDescription>
                Arquivos e documentos relacionados ao processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentos.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Data Upload</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentos.map((documento) => (
                        <TableRow key={documento.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {documento.nome}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{documento.tipo}</Badge>
                          </TableCell>
                          <TableCell>{documento.tamanho}</TableCell>
                          <TableCell>
                            {new Date(documento.data_upload).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocument(documento)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(documento)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum documento anexado a este processo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};