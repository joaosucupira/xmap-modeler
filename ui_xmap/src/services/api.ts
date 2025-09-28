const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type BancoTable = 'usuarios' | 'processos' | 'metadados' | 'areas' | 'documentos' | 'items';

export interface SearchItem {
  tabela: BancoTable;
  id: number;
  descricao: string;
  link_api: string;
}

interface SearchResponse {
  resultados: SearchItem[];
}

export async function searchAll(
  q: string,
  tabelas?: BancoTable[],
  signal?: AbortSignal
): Promise<SearchItem[]> {
  const params = new URLSearchParams();
  params.set('q', q);
  if (tabelas?.length) {
    tabelas.forEach(t => params.append('tabelas', t));
  }

  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/banco/busca-geral/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    signal
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ${res.status}`);
  }

  const data = (await res.json()) as SearchResponse;
  return data.resultados;
}