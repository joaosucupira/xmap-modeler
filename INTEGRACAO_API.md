# Integração das Interfaces com a API

Este documento explica como as interfaces foram integradas com a API FastAPI.

## Estrutura da Integração

### 1. API FastAPI (`api_domestica`)
- **Porta**: 8000
- **Endpoints principais**:
  - `/login` - Autenticação de usuários
  - `/register` - Registro de usuários
  - `/processos/` - CRUD de processos
  - `/mapas/` - CRUD de mapas
  - `/areas/` - CRUD de áreas
  - `/metadados/` - CRUD de metadados

### 2. Interface Doméstica (`interface_domestica`)
- **Porta**: 3000
- **Tecnologia**: React + Material-UI Joy
- **Serviços**: `src/services/api.js`
- **Autenticação**: JWT com interceptors automáticos

### 3. UI XMap (`ui_xmap`)
- **Porta**: 4500
- **Tecnologia**: React + TypeScript + Vite + Tailwind
- **Serviços**: `src/services/api.ts`
- **Hooks**: `src/hooks/useApi.ts`

### 4. Canvas (`canvas`)
- **Porta**: 8080
- **Tecnologia**: React + BPMN.js

## Configuração

### Variáveis de Ambiente

#### Interface Doméstica
```bash
REACT_APP_API_URL=http://localhost:8000
```

#### UI XMap
```bash
VITE_API_URL=http://localhost:8000
```

### CORS Configurado
A API está configurada para aceitar requisições das seguintes origens:
- `http://localhost:3000` (interface_domestica)
- `http://localhost:4500` (ui_xmap)
- `http://localhost:8080` (canvas)

## Como Usar

### 1. Iniciar os Serviços

```bash
# Iniciar todos os serviços
docker-compose up

# Ou iniciar individualmente
docker-compose up api
docker-compose up interface
docker-compose up ui
docker-compose up canvas
```

### 2. Acessar as Interfaces

- **Interface Doméstica**: http://localhost:3000
- **UI XMap**: http://localhost:4500
- **Canvas**: http://localhost:8080
- **API**: http://localhost:8000

### 3. Autenticação

#### Login
```javascript
import { authService } from './services/api';

// Login
const response = await authService.login(email, senha);
localStorage.setItem('access_token', response.access_token);
```

#### Registro
```javascript
// Registro
const user = await authService.register(nome, email, senha);
```

### 4. Usar os Serviços

#### Processos
```javascript
import { processService } from './services/api';

// Listar processos
const processes = await processService.getProcesses();

// Criar processo
const newProcess = await processService.createProcess({
  titulo: 'Novo Processo',
  id_area: 1
});
```

#### Mapas
```javascript
import { mapService } from './services/api';

// Listar mapas
const maps = await mapService.getMaps();

// Criar mapa
const newMap = await mapService.createMap(processId, xmlContent);
```

#### Metadados
```javascript
import { metadataService } from './services/api';

// Listar metadados
const metadata = await metadataService.getAllMetadata();

// Criar metadado
const newMetadata = await metadataService.createMetadata(
  processoId, 
  atividadeId, 
  nome, 
  lgpd, 
  dados
);
```

## Hooks Personalizados (UI XMap)

### useProcesses
```typescript
import { useProcesses } from '@/hooks/useApi';

const MyComponent = () => {
  const { processes, loading, error, createProcess, updateProcess, deleteProcess } = useProcesses();
  
  // Usar os dados e funções
};
```

### useMaps
```typescript
import { useMaps } from '@/hooks/useApi';

const MyComponent = () => {
  const { maps, loading, error, createMap } = useMaps();
  
  // Usar os dados e funções
};
```

### useAreas
```typescript
import { useAreas } from '@/hooks/useApi';

const MyComponent = () => {
  const { areas, loading, error, createArea, deleteArea } = useAreas();
  
  // Usar os dados e funções
};
```

### useMetadata
```typescript
import { useMetadata } from '@/hooks/useApi';

const MyComponent = () => {
  const { metadata, loading, error, createMetadata, updateMetadata } = useMetadata();
  
  // Usar os dados e funções
};
```

## Interceptores Automáticos

### Autenticação
- Token JWT é automaticamente adicionado às requisições
- Redirecionamento automático para login em caso de token expirado

### Tratamento de Erros
- Erros 401 redirecionam para login
- Mensagens de erro são exibidas automaticamente

## Estrutura de Dados

### Processo
```typescript
interface Processo {
  id: number;
  id_pai?: number;
  id_area?: number;
  ordem?: number;
  titulo: string;
  data_publicacao?: string;
}
```

### Mapa
```typescript
interface Mapa {
  id: number;
  id_proc: number;
  XML: string;
}
```

### Área
```typescript
interface Area {
  id: number;
  nome_area: string;
  sigla: string;
  tipo: string;
}
```

### Metadado
```typescript
interface Metadado {
  id: number;
  id_processo: number;
  id_atividade: number;
  nome: string;
  lgpd: string;
  dados: any;
}
```

## Troubleshooting

### Problema: "Failed to resolve import 'axios'"
**Erro**: `[plugin:vite:import-analysis] Failed to resolve import "axios"`

**Solução**:
```bash
cd ui_xmap
npm install axios
```

### Problemas de CORS
Se houver problemas de CORS, verifique se as origens estão configuradas corretamente no `api_domestica/app/main.py`.

### Problemas de Autenticação
- Verifique se o token está sendo salvo no localStorage
- Verifique se o token está sendo enviado nas requisições
- Verifique se o token não expirou

### Problemas de Conexão
- Verifique se a API está rodando na porta 8000
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Verifique se não há conflitos de porta

### Teste de Integração
Execute o script de teste para verificar se tudo está funcionando:
```bash
node test-integration.js
```

## Próximos Passos

1. **Implementar cache** para melhorar performance
2. **Adicionar paginação** para listas grandes
3. **Implementar filtros** e busca avançada
4. **Adicionar testes** automatizados
5. **Implementar notificações** em tempo real
6. **Adicionar upload** de arquivos
7. **Implementar versionamento** de processos

