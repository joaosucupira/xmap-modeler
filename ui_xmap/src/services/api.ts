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

// Novas funções para MacroProcesso
export interface MacroProcesso {
  id: number;
  nome: string;
  processos: number[]; // IDs de processos associados
}

export interface Processo {
  id: number;
  titulo: string;
  // Outros campos se necessário
}

export async function createMacroProcesso(nome: string): Promise<MacroProcesso> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/macro_processos/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ nome })
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).macro_processo;
}

export async function getMacroProcessos(): Promise<MacroProcesso[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/macro_processos/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).macro_processos;
}

export async function associarProcesso(macroId: number, processoId: number): Promise<void> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/macro_processos/${macroId}/associar_processo/${processoId}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) throw new Error(await res.text());
}

export async function removerProcesso(macroId: number, processoId: number): Promise<void> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/macro_processos/${macroId}/remover_processo/${processoId}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) throw new Error(await res.text());
}

export async function getProcessos(): Promise<Processo[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/processos/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).processos;
}