import { useState } from "react";
import { 
  BarChart3, 
  FileText, 
  Users, 
  Clock, 
  TrendingUp,
  Plus,
  FolderOpen
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalProcesses: number;
  activeProjects: number;
  teamMembers: number;
  avgCompletionTime: string;
}

interface RecentProcess {
  id: string;
  name: string;
  lastModified: string;
  status: 'draft' | 'review' | 'approved';
  author: string;
}

const mockStats: DashboardStats = {
  totalProcesses: 47,
  activeProjects: 12,
  teamMembers: 8,
  avgCompletionTime: "2.3 dias"
};

const mockRecentProcesses: RecentProcess[] = [
  {
    id: '1',
    name: 'Processo de Onboarding',
    lastModified: '2 horas atrás',
    status: 'draft',
    author: 'João Silva'
  },
  {
    id: '2',
    name: 'Aprovação de Compras',
    lastModified: '1 dia atrás',
    status: 'review',
    author: 'Maria Santos'
  },
  {
    id: '3',
    name: 'Gestão de Leads',
    lastModified: '3 dias atrás',
    status: 'approved',
    author: 'Pedro Costa'
  },
  {
    id: '4',
    name: 'Processo de Vendas',
    lastModified: '5 dias atrás',
    status: 'approved',
    author: 'Ana Silva'
  }
];

export const Dashboard = () => {
  const [recentProcesses] = useState<RecentProcess[]>(mockRecentProcesses);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'review': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'review': return 'Em revisão';
      case 'approved': return 'Aprovado';
      default: return status;
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-subtle">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus processos de negócio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Novo Projeto
            </Button>
            <Button className="flex items-center gap-2 bg-gradient-primary">
              <Plus className="h-4 w-4" />
              Novo Processo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-card shadow-soft border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalProcesses}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-soft border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Em desenvolvimento ou revisão
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-soft border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membros da Equipe</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.teamMembers}</div>
              <p className="text-xs text-muted-foreground">
                Colaboradores ativos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-soft border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.avgCompletionTime}</div>
              <p className="text-xs text-muted-foreground">
                Para conclusão de processos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Processes */}
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Processos Recentes
            </CardTitle>
            <CardDescription>
              Últimos processos modificados pela sua equipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProcesses.map((process) => (
              <div 
                key={process.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">{process.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Por {process.author} • {process.lastModified}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                    {getStatusText(process.status)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};