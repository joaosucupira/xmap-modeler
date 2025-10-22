import { Search, Filter, Clock, TrendingUp, X, Loader2, FileText, Settings, Users, Building, FolderOpen, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SearchResult {
  id: number;
  titulo: string;
  subtitulo: string;
  categoria: string;
  tags: string[];
  tabela: string;
  relevancia: number;
  data_modificacao?: string;
  colunas_encontradas?: string[];
  termos_busca?: string[];
  dados_extras?: any;
  link_api: string;
}

interface SearchResponse {
  resultados: SearchResult[];
  total_encontrados: number;
  termos_busca: string[];
  tabelas_pesquisadas: string[];
  metadata: {
    ordenacao: string;
    limite_por_tabela: number;
  };
}

interface Suggestion {
  texto: string;
  categoria: string;
  tipo: string;
}

interface SearchFilters {
  tabelas: string[];
  ordenacao: 'relevancia' | 'alfabetico' | 'data';
  limite: number;
}

const API_URL = "http://localhost:8000";

const TABELAS_DISPONIVEIS = [
  { id: 'processos', label: 'Processos', color: 'bg-blue-100 text-blue-800', icon: FileText },
  { id: 'metadados', label: 'Metadados', color: 'bg-green-100 text-green-800', icon: Settings },
  { id: 'usuarios', label: 'Usuários', color: 'bg-purple-100 text-purple-800', icon: Users },
  { id: 'areas', label: 'Áreas', color: 'bg-orange-100 text-orange-800', icon: Building },
  { id: 'documentos', label: 'Documentos', color: 'bg-red-100 text-red-800', icon: FolderOpen },
  { id: 'items', label: 'Itens', color: 'bg-gray-100 text-gray-800', icon: Package }
];

const ORDENACAO_OPTIONS = [
  { value: 'relevancia', label: 'Relevância', icon: TrendingUp },
  { value: 'alfabetico', label: 'Alfabética', icon: Search },
  { value: 'data', label: 'Data', icon: Clock }
];

// Nova opção de tipo de busca
const TIPOS_BUSCA = [
  { value: 'geral', label: 'Busca Geral', description: 'Busca em todas as tabelas' },
  { value: 'metadados', label: 'Processos por Metadados', description: 'Encontra processos que contêm dados específicos' }
];

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [tipoBusca, setTipoBusca] = useState<'geral' | 'metadados'>('geral');
  const [filters, setFilters] = useState<SearchFilters>({
    tabelas: [],
    ordenacao: 'relevancia',
    limite: 20
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Carrega histórico do localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Sugestões em tempo real
  useEffect(() => {
    if (searchQuery.length >= 1 && searchQuery.length < 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `${API_URL}/banco/sugestoes/?q=${encodeURIComponent(searchQuery)}&limite=8`
          );
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.sugestoes || []);
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error('Erro ao buscar sugestões:', err);
        }
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Busca principal modificada
 // ...existing code até linha 133...

  // ...existing code até a linha do useEffect...

  // Busca principal - volta para o endpoint original
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setShowSuggestions(false);

      try {
        let endpoint = '';
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          limite: filters.limite.toString()
        });

        if (tipoBusca === 'metadados') {
          // Usa o endpoint corrigido de busca por metadados
          endpoint = `${API_URL}/banco/busca-por-metadados/?${params}`;
          console.log('Buscando por metadados:', endpoint);
        } else {
          // Busca geral
          params.append('ordenar_por', filters.ordenacao);
          filters.tabelas.forEach(tabela => {
            params.append('tabelas', tabela);
          });
          endpoint = `${API_URL}/banco/busca-geral/?${params}`;
          console.log('Busca geral:', endpoint);
        }

        console.log('Fazendo requisição para:', endpoint);
        const response = await fetch(endpoint);
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          
          if (response.status === 404) {
            setResults([]);
            setError(tipoBusca === 'metadados' 
              ? 'Nenhum processo encontrado com esses metadados'
              : 'Nenhum resultado encontrado'
            );
          } else {
            throw new Error(`Erro ${response.status}: ${errorText}`);
          }
        } else {
          const data: SearchResponse = await response.json();
          console.log('Dados recebidos:', data);
          setResults(data.resultados || []);
          
          // Salva no histórico
          addToHistory(searchQuery.trim());
        }
      } catch (err) {
        console.error('Erro na busca:', err);
        setError(err instanceof Error ? err.message : 'Erro na busca');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, filters, tipoBusca]);

  const addToHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const toggleTabela = (tabela: string) => {
    setFilters(prev => ({
      ...prev,
      tabelas: prev.tabelas.includes(tabela)
        ? prev.tabelas.filter(t => t !== tabela)
        : [...prev.tabelas, tabela]
    }));
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const highlightText = (text: string, terms: string[]) => {
    if (!terms || terms.length === 0) return text;
    
    let highlightedText = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  const getCategoryColor = (categoria: string) => {
    const tabela = TABELAS_DISPONIVEIS.find(t => 
      t.label.toLowerCase().includes(categoria.toLowerCase())
    );
    return tabela?.color || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (categoria: string) => {
    const tabela = TABELAS_DISPONIVEIS.find(t => 
      t.label.toLowerCase().includes(categoria.toLowerCase())
    );
    return tabela?.icon || Package;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleResultClick = (result: SearchResult) => {
    // Navega para o item específico baseado no tipo
    if (result.tabela === 'processos') {
      window.location.href = `/processos/${result.id}`;
    } else if (result.tabela === 'metadados') {
      window.location.href = `/metadados/${result.id}`;
    } else {
      // Para outras tabelas, navega para a URL da API
      window.open(`${API_URL}${result.link_api}`, '_blank');
    }
  };

  return (
    <div className="space-y-3 relative">
      {/* Seletor de tipo de busca */}
      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-lg p-1">
          {TIPOS_BUSCA.map((tipo) => (
            <button
              key={tipo.value}
              onClick={() => setTipoBusca(tipo.value as any)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                tipoBusca === tipo.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de busca principal */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder={
              tipoBusca === 'metadados' 
                ? "Digite um dado para encontrar processos relacionados..."
                : "Buscar metadados, processos, usuários..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Menu de filtros - só aparece na busca geral */}
        {tipoBusca === 'geral' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {(filters.tabelas.length > 0 || filters.ordenacao !== 'relevancia') && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.tabelas.length || '•'}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Buscar em</DropdownMenuLabel>
              {TABELAS_DISPONIVEIS.map((tabela) => (
                <DropdownMenuCheckboxItem
                  key={tabela.id}
                  checked={filters.tabelas.includes(tabela.id)}
                  onCheckedChange={() => toggleTabela(tabela.id)}
                >
                  <tabela.icon className="h-4 w-4 mr-2" />
                  {tabela.label}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Ordenação</DropdownMenuLabel>
              {ORDENACAO_OPTIONS.map((opcao) => (
                <DropdownMenuItem
                  key={opcao.value}
                  onClick={() => setFilters(prev => ({ ...prev, ordenacao: opcao.value as any }))}
                  className={filters.ordenacao === opcao.value ? 'bg-accent' : ''}
                >
                  <opcao.icon className="h-4 w-4 mr-2" />
                  {opcao.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Descrição do tipo de busca */}
      <div className="text-xs text-muted-foreground">
        {tipoBusca === 'metadados' ? (
          <div className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            <span>Busca processos que contêm metadados com os dados especificados</span>
          </div>
        ) : (
          <span>Busca geral em todas as tabelas do sistema</span>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 p-2 space-y-1 max-h-64 overflow-y-auto shadow-lg">
          <div className="text-xs font-medium text-muted-foreground mb-2">Sugestões</div>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => selectSuggestion(suggestion.texto)}
              className="p-2 hover:bg-accent rounded cursor-pointer text-sm transition-colors"
            >
              <div className="flex items-center justify-between">
                <span>{suggestion.texto}</span>
                <Badge variant="outline" className="text-xs">
                  {suggestion.categoria}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Histórico de busca */}
      {!searchQuery && searchHistory.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Buscas recentes</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {searchHistory.slice(0, 5).map((query, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSearchQuery(query)}
              >
                {query}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Resultados */}
      {(loading || error || results.length > 0) && (
        <Card className="p-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}
          
          {!loading && results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {results.length} resultado(s) encontrado(s)
                  {tipoBusca === 'metadados' && " (processos por metadados)"}
                </span>
                <div className="flex gap-1">
                  {filters.tabelas.map(tabela => {
                    const config = TABELAS_DISPONIVEIS.find(t => t.id === tabela);
                    return config ? (
                      <Badge key={tabela} variant="outline" className="text-xs">
                        <config.icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result) => {
                  const CategoryIcon = getCategoryIcon(result.categoria);
                  
                  return (
                    <div 
                      key={`${result.tabela}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="p-4 hover:bg-accent rounded-lg border cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone da categoria */}
                        <div className={`p-2 rounded-lg ${getCategoryColor(result.categoria)} flex-shrink-0`}>
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        
                        {/* Conteúdo principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 
                                className="font-medium text-sm leading-tight mb-1"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(result.titulo, result.termos_busca || [])
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                {result.subtitulo}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {result.relevancia > 1.5 && (
                                <Badge variant="secondary" className="text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {result.relevancia.toFixed(1)}
                                </Badge>
                              )}
                              <Badge className={`text-xs ${getCategoryColor(result.categoria)}`}>
                                {result.categoria}
                              </Badge>
                            </div>
                          </div>
                          {tipoBusca === 'metadados' && result.dados_extras?.metadado_relacionado && (
                            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Settings className="h-3 w-3 text-green-600" />
                                <span className="font-medium text-green-800">Metadado encontrado:</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-green-700">LGPD:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {result.dados_extras.metadado_relacionado.lgpd}
                                  </Badge>
                                </div>
                                {result.dados_extras.metadado_relacionado.dados && 
                                 Array.isArray(result.dados_extras.metadado_relacionado.dados) && 
                                 result.dados_extras.metadado_relacionado.dados.length > 0 && (
                                  <div className="text-green-600">
                                    <span className="font-medium">Dados: </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {result.dados_extras.metadado_relacionado.dados.slice(0, 5).map((dado: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {dado}
                                        </Badge>
                                      ))}
                                      {result.dados_extras.metadado_relacionado.dados.length > 5 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{result.dados_extras.metadado_relacionado.dados.length - 5} mais
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {result.dados_extras.metadado_relacionado.id_atividade && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-700">Atividade:</span>
                                    <Badge variant="outline" className="text-xs">
                                      {result.dados_extras.metadado_relacionado.id_atividade}
                                    </Badge>
                                  </div>
                                )}
                                {result.dados_extras.correspondencia && result.dados_extras.correspondencia.length > 0 && (
                                  <div className="text-green-600">
                              
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          
                          {/* Tags */}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {result.tags.slice(0, 4).map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {result.tags.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{result.tags.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {result.data_modificacao && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(result.data_modificacao)}
                              </div>
                            )}
                            {result.colunas_encontradas && result.colunas_encontradas.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Search className="h-3 w-3" />
                                <span>Encontrado em: {result.colunas_encontradas.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};