import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface SearchFilters {
  types: string[];
  dateRange: string;
  author: string[];
}

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    dateRange: "all",
    author: []
  });

  const processTypes = [
    { id: "sales", label: "Vendas" },
    { id: "hr", label: "RH" },
    { id: "finance", label: "Financeiro" },
    { id: "operations", label: "Operações" }
  ];

  const authors = [
    { id: "user1", label: "João Silva" },
    { id: "user2", label: "Maria Santos" },
    { id: "user3", label: "Pedro Costa" }
  ];

  const toggleFilter = (category: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: Array.isArray(prev[category]) 
        ? (prev[category] as string[]).includes(value)
          ? (prev[category] as string[]).filter(item => item !== value)
          : [...(prev[category] as string[]), value]
        : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      dateRange: "all",
      author: []
    });
  };

  const getActiveFiltersCount = () => {
    return filters.types.length + filters.author.length + (filters.dateRange !== "all" ? 1 : 0);
  };

  const renderFilterBadges = () => {
    const badges = [];
    
    filters.types.forEach(type => {
      const typeLabel = processTypes.find(t => t.id === type)?.label;
      if (typeLabel) {
        badges.push(
          <Badge key={`type-${type}`} variant="secondary" className="flex items-center gap-1">
            {typeLabel}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-destructive" 
              onClick={() => toggleFilter('types', type)}
            />
          </Badge>
        );
      }
    });

    filters.author.forEach(authorId => {
      const authorLabel = authors.find(a => a.id === authorId)?.label;
      if (authorLabel) {
        badges.push(
          <Badge key={`author-${authorId}`} variant="secondary" className="flex items-center gap-1">
            Autor: {authorLabel}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-destructive" 
              onClick={() => toggleFilter('author', authorId)}
            />
          </Badge>
        );
      }
    });

    if (filters.dateRange !== "all") {
      badges.push(
        <Badge key="date" variant="secondary" className="flex items-center gap-1">
          {filters.dateRange === "week" ? "Última semana" : 
           filters.dateRange === "month" ? "Último mês" : "Último ano"}
          <X 
            className="h-3 w-3 cursor-pointer hover:text-destructive" 
            onClick={() => toggleFilter('dateRange', 'all')}
          />
        </Badge>
      );
    }

    return badges;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou conteúdo dos processos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card shadow-soft border-border/50 focus:border-primary/50"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-card shadow-soft">
              <Filter className="h-4 w-4" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Tipo de Processo</DropdownMenuLabel>
            {processTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.id}
                checked={filters.types.includes(type.id)}
                onCheckedChange={() => toggleFilter('types', type.id)}
              >
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Período</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => toggleFilter('dateRange', 'week')}>
              Última semana
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleFilter('dateRange', 'month')}>
              Último mês
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleFilter('dateRange', 'year')}>
              Último ano
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Autor</DropdownMenuLabel>
            {authors.map((author) => (
              <DropdownMenuCheckboxItem
                key={author.id}
                checked={filters.author.includes(author.id)}
                onCheckedChange={() => toggleFilter('author', author.id)}
              >
                {author.label}
              </DropdownMenuCheckboxItem>
            ))}

            {getActiveFiltersCount() > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters} className="text-destructive">
                  Limpar filtros
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {renderFilterBadges()}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-6 text-xs text-muted-foreground hover:text-destructive"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
};