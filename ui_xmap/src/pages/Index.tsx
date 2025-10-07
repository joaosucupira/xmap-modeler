import { useState } from "react";
import { ProcessTree } from "@/components/ProcessTree";
import { ProcessCanvas } from "@/components/ProcessCanvas";
import { SearchBar } from "@/components/SearchBar";
import { Dashboard } from "@/components/Dashboard";
import { 
  LayoutDashboard, 
  FileText, 
  Search,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";


const Index = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'canvas' | 'search'>('dashboard');
  const handleNewProcess = () => {
    // Abre o canvas em uma nova aba
    window.open('http://localhost:8080', '_blank');
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'canvas':
        return <ProcessCanvas />;
      case 'search':
        return (
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
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r shadow-soft flex flex-col">
        {/* Logo/Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
Xmap          </h2>
          <p className="text-sm text-muted-foreground">Modelagem de Processos</p>
        </div>

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
              variant={activeView === 'search' ? 'default' : 'ghost'}
              className="justify-start gap-2"
              onClick={() => setActiveView('search')}
            >
              <Search className="h-4 w-4" />
              Buscar Processos
            </Button>
          </div>
        </div>

        {/* Process Tree */}
        <div className="flex-1 overflow-hidden">
          <ProcessTree />
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <User className="h-4 w-4" />
            Perfil
          </Button>
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
