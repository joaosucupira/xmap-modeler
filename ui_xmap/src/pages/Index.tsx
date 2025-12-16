import { useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ProcessTree } from "@/components/ProcessTree";
import { ProcessCanvas } from "@/components/ProcessCanvas";
import { MockupProcesso } from "@/components/MockupProcessos";
import { SearchBar } from "@/components/SearchBar";
import { Dashboard } from "@/components/Dashboard";
import { 
  LayoutDashboard, 
  FileText, 
  Search,
  Settings,
  User,
  Plus,
  LogOut,
  ChevronDown,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/services/auth";
import { useNavigate } from "react-router-dom";
import CreateProcess from "./CreateProcess";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Index = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'canvas' | 'search' | 'new' | 'mockup'>('dashboard');
  const { user, logout, isAuthEnabled } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
      navigate('/login');
    }
  };

  const getUserInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderMainContent = () => {
    try {
      switch (activeView) {
        case 'dashboard':
          return (
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          );
        case 'canvas':
          return (
            <ErrorBoundary>
              <ProcessCanvas />
            </ErrorBoundary>
          );
        case 'mockup':
          return (
            <ErrorBoundary>
              <MockupProcesso />
            </ErrorBoundary>
          );
        case 'new':
          return (
            <ErrorBoundary>
              <div className="h-full flex flex-col bg-gradient-subtle">
                <div className="p-6 bg-card border-b shadow-soft">
                  <h1 className="text-2xl font-bold mb-4">Novo Processo</h1>
                </div>
                <div className="flex-1 p-6">
                  <CreateProcess onSuccess={(processoId) => {
                    setActiveView('dashboard');
                  }} />
                </div>
              </div>
            </ErrorBoundary>
          );
        case 'search':
          return (
            <ErrorBoundary>
              <div className="h-full flex flex-col bg-gradient-subtle">
                <div className="p-6 bg-card border-b shadow-soft">
                  <h1 className="text-2xl font-bold mb-4">Buscar Processos</h1>
                  <SearchBar />
                </div>
                <div className="flex-1 p-6">
                  <div className="text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Digite algo na barra de pesquisa para encontrar processos</p>
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          );
        default:
          return <Dashboard />;
      }
    } catch (error) {
      console.error('Erro ao renderizar conteúdo:', error);
      return (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar componente
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r shadow-soft flex flex-col">
        {/* Logo/Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Xmap
          </h2>
          <p className="text-sm text-muted-foreground">Modelagem de Processos</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {getUserInitials(user.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            {!isAuthEnabled && (
              <div className="mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Modo Desenvolvimento
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="p-3 border-b">
          <div className="flex flex-col gap-1">
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveView('dashboard')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeView === 'canvas' ? 'default' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveView('canvas')}
            >
              <FileText className="h-4 w-4" />
              Canvas de Modelagem
            </Button>
            <Button
              variant={activeView === 'mockup' ? 'default' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveView('mockup')}
            >
              <Map className="h-4 w-4" />
Mapeamentos            </Button>
            <Button
              variant={activeView === 'search' ? 'default' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveView('search')}
            >
              <Search className="h-4 w-4" />
              Buscar Processos
            </Button>
            <Button
              variant={activeView === 'new' ? 'default' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveView('new')}
            >
              <Plus className="h-4 w-4" />
              Novo Processo
            </Button>
          </div>
        </div>

        {/* Process Tree */}
        <div className="flex-1 overflow-auto p-3">
          <ProcessTree />
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto p-3 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Perfil
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="top">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.nome}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              {isAuthEnabled && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default Index;