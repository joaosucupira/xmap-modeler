import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDashboardData, DashboardData as DashboardDataType } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

const getStatusBadgeVariant = (status: any): "default" | "secondary" | "destructive" | "outline" => {
  // Se for booleano, trata primeiro
  if (typeof status === 'boolean') {
    // true = 'Concluído' (default/verde), false = 'Pendente' (destructive/vermelho)
    return status ? 'default' : 'destructive';
  }

  // Mantém a lógica antiga caso o status seja uma string
  const statusString = String(status ?? '').toLowerCase();
  switch (statusString) {
    case 'concluído': return 'default';
    case 'em andamento': return 'secondary';
    case 'pendente': return 'destructive';
    default: return 'outline';
  }
};

export function Dashboard() {
  const [data, setData] = useState<DashboardDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const filter = activeFilter === 'todos' ? undefined : activeFilter;
        const dashboardData = await getDashboardData(filter);
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro ao buscar os dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeFilter]);

  // 1. Lógica de renderização condicional mais segura
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500 bg-red-100 border border-red-400 rounded-md"><strong>Erro:</strong> {error}</div>;
  }

  // 2. Garante que 'data' não é nulo antes de prosseguir
  if (!data) {
    return <div className="text-center p-8">Não foi possível carregar os dados do dashboard.</div>;
  }
// ...existing imports...

function DashboardSkeleton() {
  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="space-y-6 p-6">
        {/* Skeleton para os Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton para o Gráfico */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>

        {/* Skeleton para a Tabela */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

// ...rest of your Dashboard component code...
  const statusList = ['todos', ...Object.keys(data.stats.statusCounts ?? {})];
const chartData = Object.entries(data.stats.statusCounts).map(([status, count]) => ({
  status,
  count
}));
 return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="space-y-6 p-6">
        {/* Cards de Resumo Global */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.stats.statusCounts).map(([status, count]) => (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{status || 'Sem Status'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(data.stats.statusCounts).map(([status, count]) => ({
                    status,
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#28a745" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Processos */}
        <Card>
          <CardHeader>
            <CardTitle>Processos Recentes</CardTitle>
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mt-4">
              <TabsList>
                {statusList.map(status => (
                  <TabsTrigger key={status} value={status} className="capitalize">
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Última Modificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.processosRecentes.length > 0 ? (
                  data.processosRecentes.map((processo) => (
                    <TableRow key={processo.id}>
                      <TableCell className="font-medium">{processo.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(processo.status)} className="capitalize">
                          {processo.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(processo.dataModificacao).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Nenhum processo encontrado para este filtro.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
