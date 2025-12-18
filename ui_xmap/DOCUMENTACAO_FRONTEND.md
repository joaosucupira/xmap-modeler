# 📖 Documentação do Frontend - xMap Modeler (ui_xmap)

Este documento descreve a arquitetura, componentes e funcionamento da interface do xMap Modeler.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Componentes Principais](#componentes-principais)
- [Sistema de Autenticação](#sistema-de-autenticação)
- [Serviços e API](#serviços-e-api)
- [Integração com Canvas BPMN.io](#integração-com-canvas-bpmnio)
- [Guia de Modificações](#guia-de-modificações)
- [Estilos e Temas](#estilos-e-temas)

---

## 🎯 Visão Geral

O frontend do xMap Modeler é uma aplicação **React** construída com **TypeScript** e **Vite**, utilizando a biblioteca de componentes **shadcn/ui** (baseada em Radix UI) para a interface. A aplicação é responsável por:

- Gerenciamento de processos e macroprocessos
- Visualização em árvore hierárquica
- Busca de metadados
- Dashboard com estatísticas
- Integração com o Canvas BPMN.io para modelagem de processos

### Fluxo Principal

```
App.tsx
   │
   ├── AuthProvider (Contexto de autenticação)
   │
   ├── QueryClientProvider (React Query para cache de dados)
   │
   └── BrowserRouter (Rotas)
        │
        ├── /login → LoginPage
        ├── / → Index (Dashboard principal)
        ├── /create-process → CreateProcess
        ├── /novo-processo → ProcessTreeView
        └── /* → NotFound
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.3.x | Framework principal |
| **TypeScript** | 5.x | Tipagem estática |
| **Vite** | 5.x | Bundler e dev server |
| **TanStack Query** | 5.x | Gerenciamento de estado e cache |
| **React Router** | 6.x | Roteamento |
| **shadcn/ui** | - | Biblioteca de componentes |
| **Radix UI** | - | Primitivos acessíveis |
| **Tailwind CSS** | 3.x | Estilização |
| **Recharts** | 2.x | Gráficos |
| **Lucide React** | - | Ícones |
| **Zod** | 3.x | Validação de schemas |
| **React Hook Form** | 7.x | Formulários |

---

## 📁 Estrutura de Pastas

```
ui_xmap/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/              # Componentes shadcn/ui (primitivos)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── Dashboard.tsx    # Painel principal com estatísticas
│   │   ├── ErrorBoundary.tsx # Captura de erros React
│   │   ├── MockupProcessos.tsx # Visualização de mapeamentos
│   │   ├── NavMenu.tsx      # Menu de navegação/header
│   │   ├── ProcessCanvas.tsx # Gerenciamento de hierarquia
│   │   ├── ProcessTree.tsx  # Árvore de processos
│   │   ├── ProcessViewer.tsx # Visualizador de processos
│   │   ├── ProtectedRouteProps.tsx # Rota protegida
│   │   └── SearchBar.tsx    # Busca de metadados
│   │
│   ├── hooks/               # Hooks customizados
│   │   ├── use-mobile.tsx   # Detecta dispositivo móvel
│   │   └── use-toast.ts     # Sistema de notificações
│   │
│   ├── lib/                 # Utilitários
│   │   └── utils.ts         # Funções auxiliares (cn, etc.)
│   │
│   ├── pages/               # Páginas/rotas
│   │   ├── CreateProcess.tsx # Criação de processos
│   │   ├── Index.tsx        # Página principal
│   │   ├── LoginPage.tsx    # Tela de login/cadastro
│   │   ├── NotFound.tsx     # Página 404
│   │   └── ProcessTreeView.tsx # Visualização em árvore
│   │
│   ├── services/            # Serviços de comunicação
│   │   ├── api.ts           # Chamadas genéricas à API
│   │   ├── auth.tsx         # Contexto e serviços de auth
│   │   ├── processService.ts # Serviços de processos
│   │   └── search.ts        # Serviços de busca
│   │
│   ├── App.tsx              # Componente raiz
│   ├── App.css              # Estilos globais
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind imports
│
├── vite.config.ts           # Configuração Vite
├── tailwind.config.ts       # Configuração Tailwind
├── tsconfig.json            # Configuração TypeScript
└── package.json             # Dependências
```

---

## 🧩 Componentes Principais

### 1. **Index.tsx** (Página Principal)

A página principal é um layout com sidebar que contém todas as views do sistema:

```tsx
// Estados de visualização
type ViewType = 'dashboard' | 'canvas' | 'search' | 'new' | 'mockup';
```

**Funcionalidades:**
- **Dashboard**: Estatísticas e processos recentes
- **Canvas de Modelagem**: Gerenciamento de hierarquia
- **Mapeamentos**: Visualização de mockups
- **Buscar Processos**: Busca de metadados
- **Novo Processo**: Criação de processos

**Como modificar:**
```tsx
// Para adicionar uma nova view:
// 1. Adicione ao type
type ViewType = 'dashboard' | 'canvas' | 'minhaNovaView';

// 2. Adicione no switch do renderMainContent
case 'minhaNovaView':
  return <MeuNovoComponente />;

// 3. Adicione o botão na sidebar
<Button
  variant={activeView === 'minhaNovaView' ? 'default' : 'ghost'}
  onClick={() => setActiveView('minhaNovaView')}
>
  Minha Nova View
</Button>
```

---

### 2. **ProcessCanvas.tsx** (Gerenciamento de Hierarquia)

Componente principal para gerenciar a estrutura hierárquica:

```
MacroProcesso (violet/purple) 🟣
    └── Processo (blue/cyan) 🔵
            ├── Mapa (emerald/teal) 🟢
            └── SubProcesso (blue/cyan) 🔵
                    └── Mapa (emerald/teal) 🟢
```

**Funcionalidades:**
- Criar/deletar macroprocessos
- Criar/deletar processos e subprocessos
- Criar/deletar mapas BPMN
- Mover processos entre macroprocessos
- Mover mapas entre processos

**API Endpoints utilizados:**
```typescript
GET    /hierarchy/           // Busca hierarquia completa
POST   /macroprocessos/      // Cria macroprocesso
DELETE /macroprocessos/:id   // Deleta macroprocesso
POST   /processos/           // Cria processo
DELETE /processos/:id        // Deleta processo
PUT    /processos/:id/move   // Move processo
POST   /mapas/               // Cria mapa
DELETE /mapas/:id            // Deleta mapa
PUT    /mapas/:id/move       // Move mapa
```

---

### 3. **Dashboard.tsx** (Painel de Estatísticas)

Exibe informações gerais do sistema:
- Cards com contagem por status
- Gráfico de barras (Recharts)
- Tabela de processos recentes
- Filtros por status

**Dados consumidos:**
```typescript
interface DashboardData {
  stats: {
    totalProcessos: number;
    statusCounts: Record<string, number>;
  };
  processosRecentes: {
    id: number;
    titulo: string;
    status: string;
    dataModificacao: string;
  }[];
}
```

---

### 4. **SearchBar.tsx** (Busca de Metadados)

Sistema completo de busca com:
- Busca com debounce (500ms)
- Filtros por LGPD e Mapa
- Ordenação (relevância, alfabética, recente)
- Histórico de buscas (localStorage)
- Integração direta com Canvas BPMN

**Endpoint:**
```
GET /metadados/buscar/?termo={termo}
```

---

### 5. **LoginPage.tsx** (Autenticação)

Tabs para Login e Cadastro:
- Validação de formulários
- Auto-login após cadastro
- Feedback visual de erros

---

## 🔐 Sistema de Autenticação

O sistema de auth está em `services/auth.tsx`:

### AuthProvider

```tsx
// Contexto global de autenticação
<AuthProvider>
  <App />
</AuthProvider>
```

### Funções Disponíveis

```typescript
const { 
  isAuthenticated,  // boolean - usuário logado?
  isAuthEnabled,    // boolean - auth habilitada na API?
  user,            // User | null - dados do usuário
  login,           // (email, password) => Promise
  register,        // (nome, email, password) => Promise
  logout,          // () => void
  loading          // boolean - carregando auth?
} = useAuth();
```

### Modo Desenvolvimento

Quando `AUTH_ENABLED=false` na API:
```tsx
// Usuário padrão é criado automaticamente
{ id: 1, nome: 'Usuário Padrão', email: 'admin@xmap.com' }
```

### ProtectedRoute

Protege rotas que requerem autenticação:
```tsx
<Route 
  path="/" 
  element={
    <ProtectedRoute>
      <Index />
    </ProtectedRoute>
  } 
/>
```

---

## 🌐 Serviços e API

### Configuração Base

```typescript
// Em todos os services
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### api.ts - Funções Genéricas

```typescript
// Busca geral no banco
searchAll(q: string, tabelas?: BancoTable[]): Promise<SearchItem[]>

// Dados do dashboard
getDashboardData(status?: string): Promise<DashboardData>
```

### processService.ts - CRUD de Processos

```typescript
// Criar processo
processService.criar(data: ProcessoData): Promise<Processo>

// Criar mapa BPMN
processService.criarMapa(data: MapaData): Promise<Mapa>
```

### React Query

Utilizado para cache e sincronização:
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['hierarchy'],
  queryFn: fetchHierarchy,
});

const mutation = useMutation({
  mutationFn: createProcess,
  onSuccess: () => queryClient.invalidateQueries(['hierarchy']),
});
```

---

## 🎨 Integração com Canvas BPMN.io

O Canvas é uma aplicação separada (porta 8080) que utiliza **bpmn.io** para modelagem de processos.

### Como a Integração Funciona

#### 1. Abertura do Canvas

O frontend abre o Canvas em uma nova aba:

```typescript
// Em ProcessCanvas.tsx e ProcessTreeView.tsx
const handleView = () => {
  window.open(`http://localhost:8080?mapa=${mapId}&mode=view`, '_blank');
};

const handleEdit = () => {
  window.open(`http://localhost:8080?mapa=${mapId}&mode=edit`, '_blank');
};
```

#### 2. Parâmetros da URL

| Parâmetro | Descrição | Valores |
|-----------|-----------|---------|
| `mapa` | ID do mapa no banco | número |
| `mode` | Modo de operação | `view` ou `edit` |

#### 3. Criação de Mapa com XML Padrão

Quando um novo mapa é criado, um XML BPMN básico é enviado:

```typescript
const DEFAULT_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions ...>
  <bpmn:collaboration>
    <bpmn:participant processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram>
    <!-- Informações visuais -->
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
```

#### 4. Fluxo de Dados

```
Frontend (ui_xmap)                    Canvas (bpmn.io)
       │                                    │
       │ ──── POST /mapas/ ──────────────► │ (cria mapa)
       │                                    │
       │ ──── window.open(?mapa=X) ──────► │ (abre editor)
       │                                    │
       │                     Canvas carrega │
       │ ◄──── GET /mapas/X ──────────────│ (busca XML)
       │                                    │
       │                      Usuário edita │
       │ ◄──── PUT /mapas/X ──────────────│ (salva XML)
       │                                    │
```

#### 5. Botões de Ação em Mapas

```tsx
// Visualização (modo somente leitura)
<Button onClick={() => handleView(mapId)}>
  <Eye /> Ver
</Button>

// Edição (modo completo)
<Button onClick={() => handleEdit(mapId)}>
  <Edit /> Editar
</Button>
```

### URL do Canvas

```typescript
const CANVAS_URL = "http://localhost:8080";
```

Para mudar a URL do canvas, modifique em:
- `ProcessCanvas.tsx` (linha ~221)
- `ProcessTreeView.tsx` (linha ~101)
- `SearchBar.tsx` (linha ~52)

---

## 🔧 Guia de Modificações

### Adicionar Novo Componente UI (shadcn)

```bash
# Via CLI shadcn
npx shadcn-ui@latest add [componente]

# Exemplo
npx shadcn-ui@latest add calendar
```

### Adicionar Nova Página

1. Criar arquivo em `src/pages/`:
```tsx
// src/pages/MinhaPage.tsx
export default function MinhaPage() {
  return <div>Minha Página</div>;
}
```

2. Adicionar rota em `App.tsx`:
```tsx
<Route 
  path="/minha-rota" 
  element={
    <ProtectedRoute>
      <MinhaPage />
    </ProtectedRoute>
  } 
/>
```

### Adicionar Novo Endpoint

1. Criar função em `services/`:
```typescript
// services/meuService.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function meuEndpoint(data: MeuTipo): Promise<Resposta> {
  const response = await fetch(`${API_URL}/meu-endpoint/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) throw new Error('Erro');
  return response.json();
}
```

2. Usar com React Query:
```tsx
const mutation = useMutation({
  mutationFn: meuEndpoint,
  onSuccess: () => {
    toast({ title: 'Sucesso!' });
    queryClient.invalidateQueries(['minhaQuery']);
  },
});
```

### Modificar Estilos Globais

- **Tailwind config**: `tailwind.config.ts`
- **CSS global**: `src/index.css`
- **Variáveis CSS (cores)**: `src/index.css`

### Variáveis de Ambiente

Criar arquivo `.env`:
```env
VITE_API_URL=http://localhost:8000
```

Acessar no código:
```typescript
const url = import.meta.env.VITE_API_URL;
```

---

## 🎨 Estilos e Temas

### Sistema de Cores

O projeto usa um esquema de cores por tipo de entidade:

| Entidade | Cor | Tailwind Classes |
|----------|-----|------------------|
| MacroProcesso | Violeta/Roxo | `violet-*`, `purple-*` |
| Processo | Azul/Ciano | `blue-*`, `cyan-*` |
| Mapa | Verde/Turquesa | `emerald-*`, `teal-*` |

### Gradientes

```tsx
// MacroProcesso
className="bg-gradient-to-br from-violet-500 to-purple-600"

// Processo
className="bg-gradient-to-br from-blue-500 to-cyan-600"

// Mapa
className="bg-gradient-to-br from-emerald-500 to-teal-600"
```

### Utilitário cn()

Combina classes condicionalmente:
```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-class"
)} />
```

---

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
cd ui_xmap
npm install  # ou bun install
npm run dev  # Inicia em http://localhost:4500
```

### Build
```bash
npm run build     # Build de produção
npm run preview   # Preview do build
```

### Docker
```bash
docker build -t ui_xmap .
docker run -p 4500:80 ui_xmap
```

---

## 📝 Checklist de Modificações Comuns

- [ ] **Nova view na sidebar**: Modificar `Index.tsx`
- [ ] **Novo endpoint**: Criar em `services/`, usar com React Query
- [ ] **Novo componente UI**: `npx shadcn-ui@latest add [nome]`
- [ ] **Mudar URL da API**: Variável `VITE_API_URL`
- [ ] **Mudar URL do Canvas**: Buscar por `localhost:8080` e substituir
- [ ] **Nova rota protegida**: Adicionar em `App.tsx` com `ProtectedRoute`
- [ ] **Modificar cores**: Editar `tailwind.config.ts` ou classes diretamente

---

## 🔗 Links Úteis

- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Vite](https://vitejs.dev/)
- [bpmn.io](https://bpmn.io/)
- [Radix UI](https://www.radix-ui.com/)
