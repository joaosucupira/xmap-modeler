import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Filter, Clock, TrendingUp, X, Loader2, FileText, Settings, Tag, ExternalLink, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { debounce } from "lodash";
import { useToast } from "@/components/ui/use-toast";

interface Metadado {
  id: number;
  nome: string;
  dados: string[];
  lgpd: string;
  id_processo: number; // ID do MAPA
  id_atividade: string;
}

interface SearchResult {
  metadados: Metadado[];
}

interface Filtros {
  lgpd: string[];
  mapas: number[];
}

const API_URL = "http://localhost:8000";
const CANVAS_URL = "http://localhost:8080";

const ORDENACAO_OPTIONS = [
  { value: 'relevancia', label: 'Relevância', icon: TrendingUp },
  { value: 'alfabetico', label: 'Alfabética', icon: Search },
  { value: 'recente', label: 'Mais Recente', icon: Clock }
];

// Opções de LGPD conhecidas
const LGPD_OPTIONS = [
  { value: 'public', label: 'Público' },
  { value: 'sensivel', label: 'Sensível' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'anonimizado', label: 'Anonimizado' },
  { value: 'confidencial', label: 'Confidencial' },
];

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Metadado[]>([]);
  const [filteredResults, setFilteredResults] = useState<Metadado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<'relevancia' | 'alfabetico' | 'recente'>('relevancia');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState<Filtros>({
    lgpd: [],
    mapas: [],
  });
  
  // Opções disponíveis extraídas dos resultados
  const [availableLgpd, setAvailableLgpd] = useState<string[]>([]);
  const [availableMapas, setAvailableMapas] = useState<number[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Carrega histórico do localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Extrai opções disponíveis dos resultados
  useEffect(() => {
    if (results.length > 0) {
      const lgpdSet = new Set(results.map(r => r.lgpd).filter(Boolean));
      const mapasSet = new Set(results.map(r => r.id_processo).filter(Boolean));
      
      setAvailableLgpd(Array.from(lgpdSet).sort());
      setAvailableMapas(Array.from(mapasSet).sort((a, b) => a - b));
    } else {
      setAvailableLgpd([]);
      setAvailableMapas([]);
    }
  }, [results]);

  // Aplica filtros aos resultados
  useEffect(() => {
    let filtered = [...results];
    
    // Filtro por LGPD
    if (filtros.lgpd.length > 0) {
      filtered = filtered.filter(r => filtros.lgpd.includes(r.lgpd));
    }
    
    // Filtro por Mapa
    if (filtros.mapas.length > 0) {
      filtered = filtered.filter(r => filtros.mapas.includes(r.id_processo));
    }
    
    // Aplicar ordenação
    if (ordenacao === 'alfabetico') {
      filtered = filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenacao === 'recente') {
      filtered = filtered.sort((a, b) => b.id - a.id);
    }
    
    setFilteredResults(filtered);
  }, [results, filtros, ordenacao]);

  const searchMetadados = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      setFilteredResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando por metadados:', searchTerm);
      const url = `${API_URL}/metadados/buscar/?termo=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          setResults([]);
          setFilteredResults([]);
          setError('Nenhum metadado encontrado');
          return;
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data: SearchResult = await response.json();
      console.log('✅ Resultados encontrados:', data);
      
      setResults(data.metadados || []);
      addToHistory(searchTerm);
    } catch (err) {
      console.error('❌ Erro ao buscar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar metadados');
      setResults([]);
      setFilteredResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (searchTerm: string) => {
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const debouncedSearch = useCallback(
    debounce((term: string) => searchMetadados(term), 500),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setFilteredResults([]);
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

  const handleMetadatoClick = (metadado: Metadado) => {
    const mapaId = metadado.id_processo;
    
    if (!mapaId || mapaId <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Este metadado não possui um mapa associado",
      });
      return;
    }

    const canvasUrl = `${CANVAS_URL}?mapa=${mapaId}&mode=view`;
    console.log('✅ Abrindo canvas:', canvasUrl);
    window.open(canvasUrl, '_blank');
  };

  // Toggle filtro LGPD
  const toggleLgpdFilter = (lgpd: string) => {
    setFiltros(prev => ({
      ...prev,
      lgpd: prev.lgpd.includes(lgpd)
        ? prev.lgpd.filter(l => l !== lgpd)
        : [...prev.lgpd, lgpd]
    }));
  };

  // Toggle filtro Mapa
  const toggleMapaFilter = (mapa: number) => {
    setFiltros(prev => ({
      ...prev,
      mapas: prev.mapas.includes(mapa)
        ? prev.mapas.filter(m => m !== mapa)
        : [...prev.mapas, mapa]
    }));
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setFiltros({ lgpd: [], mapas: [] });
  };

  // Conta filtros ativos
  const activeFiltersCount = filtros.lgpd.length + filtros.mapas.length;

  return (
    <div className="space-y-4">
      {/* Descrição da busca */}
      <div className="text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <Settings className="h-3 w-3" />
          <span>Busca em metadados, dados LGPD e atividades</span>
        </div>
      </div>

      {/* Barra de busca principal */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por metadados, LGPD, dados..."
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

        {/* Botão de Filtros */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Refine sua busca usando os filtros abaixo
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6 space-y-6">
              {/* Filtro LGPD */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Classificação LGPD</Label>
                {availableLgpd.length > 0 ? (
                  <div className="space-y-2">
                    {availableLgpd.map((lgpd) => (
                      <div key={lgpd} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lgpd-${lgpd}`}
                          checked={filtros.lgpd.includes(lgpd)}
                          onCheckedChange={() => toggleLgpdFilter(lgpd)}
                        />
                        <label
                          htmlFor={`lgpd-${lgpd}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {lgpd}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({results.filter(r => r.lgpd === lgpd).length})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Faça uma busca para ver as opções disponíveis
                  </p>
                )}
              </div>

              <Separator />

              {/* Filtro por Mapa */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Mapas</Label>
                {availableMapas.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableMapas.map((mapa) => (
                      <div key={mapa} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mapa-${mapa}`}
                          checked={filtros.mapas.includes(mapa)}
                          onCheckedChange={() => toggleMapaFilter(mapa)}
                        />
                        <label
                          htmlFor={`mapa-${mapa}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Mapa #{mapa}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({results.filter(r => r.id_processo === mapa).length})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Faça uma busca para ver as opções disponíveis
                  </p>
                )}
              </div>
            </div>

            <SheetFooter>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
              >
                Limpar filtros
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>
                Aplicar
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Menu de ordenação */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Ordenar
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

      {/* Filtros ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
          {filtros.lgpd.map((lgpd) => (
            <Badge 
              key={`lgpd-${lgpd}`} 
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toggleLgpdFilter(lgpd)}
            >
              LGPD: {lgpd}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filtros.mapas.map((mapa) => (
            <Badge 
              key={`mapa-${mapa}`} 
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => toggleMapaFilter(mapa)}
            >
              Mapa: #{mapa}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={clearFilters}
          >
            Limpar todos
          </Button>
        </div>
      )}

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
      {!loading && !error && filteredResults.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-sm font-medium text-muted-foreground">
              {filteredResults.length} de {results.length} metadado(s)
              {activeFiltersCount > 0 && ' (filtrado)'}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {(() => {
                const Icon = ORDENACAO_OPTIONS.find(o => o.value === ordenacao)!.icon;
                return <Icon className="h-3 w-3" />;
              })()}
              <span>{ORDENACAO_OPTIONS.find(o => o.value === ordenacao)?.label}</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredResults.map((metadado) => (
              <Card 
                key={metadado.id} 
                className="hover:shadow-md transition-all cursor-pointer group hover:border-primary/50"
                onClick={() => handleMetadatoClick(metadado)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0 group-hover:bg-green-200 transition-colors">
                        <Settings className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle 
                          className="text-base leading-tight group-hover:text-primary transition-colors"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(metadado.nome, query)
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="ml-2 flex-shrink-0">
                        Mapa: {metadado.id_processo}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Tag className="h-3 w-3" />
                    Atividade: {metadado.id_atividade}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-2 text-muted-foreground">LGPD:</p>
                    <Badge variant="secondary" className="font-medium">
                      {metadado.lgpd}
                    </Badge>
                  </div>

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

                  <div className="pt-2 border-t text-xs text-muted-foreground flex items-center justify-between">
                    <span>Metadado #{metadado.id}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                      Clique para abrir o mapa →
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State - Com filtros ativos */}
      {!loading && !error && results.length > 0 && filteredResults.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Filter className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">Nenhum resultado com os filtros atuais</p>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Tente ajustar os filtros para ver mais resultados.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State - Sem resultados */}
      {!loading && !error && query && results.length === 0 && query.length >= 2 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">Nenhum resultado encontrado</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Tente buscar com outros termos ou verifique a ortografia.
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
              Digite algo para buscar metadados, LGPD ou dados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};