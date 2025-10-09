import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface CreateProcessProps {
  onSuccess?: (processoId: number) => void;
}

interface ProcessoPayload {
  titulo: string;
  id_area?: number | null;
  id_pai?: number | null;
  ordem?: number | null;
  data_publicacao?: string | null;
}

const API_URL = "http://localhost:8000";

const CreateProcess: React.FC<CreateProcessProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<ProcessoPayload>({
    titulo: "",
    id_area: null,
  });
  const [criarMapa, setCriarMapa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProcesso = async (payload: ProcessoPayload) => {
    const queryParams = new URLSearchParams();
    if (payload.titulo) queryParams.append('titulo', payload.titulo);
    
    const response = await fetch(`${API_URL}/processos/?${queryParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_pai: payload.id_pai ?? null,
        id_area: payload.id_area ?? null,
        ordem: payload.ordem ?? null,
        data_publicacao: payload.data_publicacao ?? null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar processo: ${response.statusText}`);
    }

    return response.json();
  };

const createMapa = async (processoId: number) => {
  const queryParams = new URLSearchParams({
    id_proc: processoId.toString(),
    XML: "<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"></bpmn:definitions>"
  });
    
  const response = await fetch(`${API_URL}/mapas/?${queryParams}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao criar mapa: ${response.statusText}`);
  }

  return response.json();
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Criar processo
      const processoResult = await createProcesso(formData);
      const processoId = processoResult?.processo?.id;

      if (!processoId) {
        throw new Error("ID do processo não retornado pela API");
      }

      // Criar mapa se necessário
      if (criarMapa) {
        await createMapa(processoId);
      }

      toast.success("Processo criado com sucesso!");
      
      // Resetar formulário
      setFormData({ titulo: "", id_area: null });
      setCriarMapa(false);
      
      // Callback de sucesso
      if (onSuccess) onSuccess(processoId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error("Erro:", errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : null) : value
    }));
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Processo</Label>
            <Input
              id="titulo"
              name="titulo"
              placeholder="Digite o título do processo"
              value={formData.titulo}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_area">ID da Área</Label>
            <Input
              id="id_area"
              name="id_area"
              type="number"
              placeholder="Digite o ID da área"
              value={formData.id_area ?? ""}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="criarMapa"
              checked={criarMapa}
              onCheckedChange={(checked) => setCriarMapa(checked as boolean)}
            />
            <Label
              htmlFor="criarMapa"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Criar mapa BPMN para este processo
            </Label>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={loading || !formData.titulo.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Criando..." : "Criar Processo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateProcess;