const API_URL = "http://localhost:8000";

interface ProcessoData {
  id_pai: number | null;
  id_area: number | null;
  ordem: number | null;
  titulo: string;
  data_publicacao: string | null;
}

interface MapaData {
  id_proc: number;
  XML: string;
}

export const processService = {
  async criar(data: ProcessoData) {
    try {
      const response = await fetch(`${API_URL}/processos/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro ao criar processo: ${errText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Falha na requisição: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao criar processo');
    }
  },

  async criarMapa(data: MapaData) {
    try {
      const response = await fetch(`${API_URL}/mapas/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro ao criar mapa: ${errText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Falha na requisição: ${error.message}`);
      }
      throw new Error('Erro desconhecido ao criar mapa');
    }
  }
};