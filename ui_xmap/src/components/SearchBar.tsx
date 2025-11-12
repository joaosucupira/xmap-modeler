import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Filter, Clock, TrendingUp, X, Loader2, FileText, Settings, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { debounce } from "lodash";

interface Metadado {
  id: number;
  nome: string;
  dados: string[];
  lgpd: string;
  id_processo: number;
  id_atividade: string;
}

interface SearchResult {
  metadados: Metadado[];
}

const API_URL = "http://localhost:8000";

const TIPOS_BUSCA = [
  { value: 'metadados', label: 'Busca por Metadados', description: 'Busca em metadados e dados LGPD' },
  { value: 'processos', label: 'Busca por Processos', description: 'Busca processos que contêm dados específicos' }
];

const ORDENACAO_OPTIONS = [
  { value: 'relevancia', label: 'Relevância', icon: TrendingUp },
  { value: 'alfabetico', label: 'Alfabética', icon: Search },
  { value: 'recente', label: 'Mais Recente', icon: Clock }
];

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Metadado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoBusca, setTipoBusca] = useState<'metadados' | 'processos'>('metadados');
  const [ordenacao, setOrdenacao] = useState<'relevancia' | 'alfabetico' | 'recente'>('relevancia');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carrega histórico do localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const searchMetadados = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando por metadados:', searchTerm);
      const url = `${API_URL}/metadados/buscar/?termo=${encodeURIComponent(searchTerm)}`;
      console.log('📡 URL da requisição:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setResults([]);
          setError('Nenhum metadado encontrado');
          return;
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data: SearchResult = await response.json();
      console.log('✅ Resultados encontrados:', data);
      
      let sortedResults = data.metadados || [];
      
      // Aplicar ordenação
      if (ordenacao === 'alfabetico') {
        sortedResults = [...sortedResults].sort((a, b) => a.nome.localeCompare(b.nome));
      } else if (ordenacao === 'recente') {
        sortedResults = [...sortedResults].sort((a, b) => b.id - a.id);
      }
      
      setResults(sortedResults);
      
      // Salvar no histórico
      addToHistory(searchTerm);
    } catch (err) {
      console.error('❌ Erro ao buscar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar metadados');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (searchTerm: string) => {
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Debounce para evitar muitas requisições
  const debouncedSearch = useCallback(
    debounce((term: string) => searchMetadados(term), 500),
    [ordenacao]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    searchMetadados(historyQuery);
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  // Re-ordenar quando mudar a ordenação
  useEffect(() => {
    if (query.length >= 2) {
      searchMetadados(query);
    }
  }, [ordenacao]);

  return (
    <div className="space-y-4">
      {/* Seletor de tipo de busca */}
      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-lg p-1">
          {TIPOS_BUSCA.map((tipo) => (
            <button
              key={tipo.value}
              onClick={() => setTipoBusca(tipo.value as any)}
              className={`px-4 py-2 text-sm rounded-md transition-all ${
                tipoBusca === tipo.value
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={tipo.description}
            >
              {tipo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Descrição do tipo de busca */}
      <div className="text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          {tipoBusca === 'metadados' ? (
            <>
              <Settings className="h-3 w-3" />
              <span>Busca em metadados, dados LGPD e atividades</span>
            </>
          ) : (
            <>
              <FileText className="h-3 w-3" />
              <span>Busca processos que contêm dados específicos</span>
            </>
          )}
        </div>
      </div>

      {/* Barra de busca principal */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={
              tipoBusca === 'metadados'
                ? "Buscar por metadados, LGPD, dados..."
                : "Buscar processos por dados (ex: CPF, email)..."
            }
            value={query}
            onChange={handleInputChange}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Menu de ordenação */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Ordenar
              {ordenacao !== 'relevancia' && (
                <Badge variant="secondary" className="ml-1">•</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ORDENACAO_OPTIONS.map((opcao) => (
              <DropdownMenuItem
                key={opcao.value}
                onClick={() => setOrdenacao(opcao.value as any)}
                className={ordenacao === opcao.value ? 'bg-accent' : ''}
              >
                <opcao.icon className="h-4 w-4 mr-2" />
                {opcao.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Histórico de busca */}
      {!query && searchHistory.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Buscas recentes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((historyQuery, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleHistoryClick(historyQuery)}
              >
                {historyQuery}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Buscando...</span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-sm text-red-500 mt-2">Tente buscar com outros termos</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-sm font-medium text-muted-foreground">
              {results.length} resultado(s) encontrado(s)
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {ORDENACAO_OPTIONS.find(o => o.value === ordenacao)?.icon && (
                <>
                  {(() => {
                    const Icon = ORDENACAO_OPTIONS.find(o => o.value === ordenacao)!.icon;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  <span>{ORDENACAO_OPTIONS.find(o => o.value === ordenacao)?.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {results.map((metadado) => (
              <Card key={metadado.id} className="hover:shadow-md transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <Settings className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle 
                          className="text-base leading-tight"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(metadado.nome, query)
                          }}
                        />
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      ID: {metadado.id}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Tag className="h-3 w-3" />
                    Processo: {metadado.id_processo} | Atividade: {metadado.id_atividade}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* LGPD */}
                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground">LGPD:</p>
                    <Badge variant="secondary" className="font-medium">
                      {metadado.lgpd}
                    </Badge>
                  </div>

                  {/* Dados */}
                  {metadado.dados && metadado.dados.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-muted-foreground">
                        Dados ({metadado.dados.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {metadado.dados.slice(0, 8).map((dado, index) => (
                          <Badge 
                            key={index} 
                            variant="outline"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(dado, query)
                            }}
                          />
                        ))}
                        {metadado.dados.length > 8 && (
                          <Badge variant="outline" className="bg-muted">
                            +{metadado.dados.length - 8} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer com data ou info adicional */}
                  <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    <span>Metadado #{metadado.id}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && query && results.length === 0 && query.length >= 2 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">Nenhum resultado encontrado</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Tente buscar com outros termos ou verifique a ortografia. 
              Digite pelo menos 2 caracteres para iniciar a busca.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!query && !loading && results.length === 0 && searchHistory.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Search className="h-12 w-12 text-primary" />
            </div>
            <p className="text-lg font-semibold mb-2">Buscar Metadados</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Digite algo para começar a busca por metadados, LGPD ou dados.
              Use pelo menos 2 caracteres.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};