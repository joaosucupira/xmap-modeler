import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: number;
  type: 'processo' | 'metadado';
  title: string;
  description?: string;
}

interface ProcessoResponse {
  processos: Array<{
    id: number;
    titulo: string;
    data_publicacao?: string;
  }>;
}

interface MetadadoResponse {
  metadados: Array<{
    id: number;
    nome: string;
    lgpd: string;
    dados: string[];
    id_processo: number;
    id_atividade: string;
  }>;
}

interface SearchFilters {
  sources: ('processo' | 'metadado')[];
}

const API_URL = "http://localhost:8000";

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    sources: ['processo', 'metadado']
  });

  const searchSources = [
    { id: 'processo' as const, label: 'Processos' },
    { id: 'metadado' as const, label: 'Metadados' }
  ];

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchPromises: Promise<SearchResult[]>[] = [];
        const query = searchQuery.trim();

        if (filters.sources.includes('processo')) {
          searchPromises.push(
            fetch(`${API_URL}/processos/?q=${encodeURIComponent(query)}`)
              .then(res => {
                if (!res.ok) throw new Error('Erro ao buscar processos');
                return res.json();
              })
              .then((data: ProcessoResponse) => {
                const processos = data.processos || [];
                return processos.map(p => ({
                  id: p.id,
                  type: 'processo' as const,
                  title: p.titulo,
                  description: `Processo #${p.id}`
                }));
              })
          );
        }

        if (filters.sources.includes('metadado')) {
          searchPromises.push(
            fetch(`${API_URL}/metadados/buscar/?termo=${encodeURIComponent(query)}`)
              .then(res => {
                if (!res.ok) throw new Error('Erro ao buscar metadados');
                return res.json();
              })
              .then((data: MetadadoResponse) => {
                const metadados = data.metadados || [];
                return metadados.map(m => ({
                  id: m.id,
                  type: 'metadado' as const,
                  title: m.nome,
                  description: `LGPD: ${m.lgpd}, Dados: ${m.dados.join(', ')}`
                }));
              })
          );
        }

        const results = await Promise.all(searchPromises);
        setResults(results.flat());
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Erro na busca');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchData, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters]);

  const toggleFilter = (source: 'processo' | 'metadado') => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar processos e metadados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {filters.sources.length < searchSources.length && (
                <Badge variant="secondary" className="ml-1">
                  {filters.sources.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Buscar em</DropdownMenuLabel>
            {searchSources.map((source) => (
              <DropdownMenuCheckboxItem
                key={source.id}
                checked={filters.sources.includes(source.id)}
                onCheckedChange={() => toggleFilter(source.id)}
              >
                {source.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(loading || error || results.length > 0) && (
        <div className="border rounded-md bg-card p-2 space-y-2">
          {loading && (
            <div className="text-sm text-muted-foreground">Buscando...</div>
          )}
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          {!loading && results.map((result) => (
            <div 
              key={`${result.type}-${result.id}`} 
              className="p-2 hover:bg-muted rounded-sm cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{result.title}</div>
                  {result.description && (
                    <div className="text-sm text-muted-foreground">
                      {result.description}
                    </div>
                  )}
                </div>
                <Badge variant="outline">
                  {result.type === 'processo' ? 'Processo' : 'Metadado'}
                </Badge>
              </div>
            </div>
          ))}
          {!loading && !error && results.length === 0 && searchQuery.trim().length >= 2 && (
            <div className="text-sm text-muted-foreground p-2">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
};