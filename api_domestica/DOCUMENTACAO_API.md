# 📖 Documentação da API - xMap Modeler

Este documento descreve a arquitetura, endpoints e relacionamentos de dados da API backend do xMap Modeler.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Modelos de Dados](#modelos-de-dados)
- [Relacionamentos entre Entidades](#relacionamentos-entre-entidades)
- [Endpoints da API](#endpoints-da-api)
- [Sistema de Autenticação](#sistema-de-autenticação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Guia de Modificações](#guia-de-modificações)

---

## 🎯 Visão Geral

A API do xMap Modeler é construída com **FastAPI** e utiliza **PostgreSQL** como banco de dados. Fornece endpoints RESTful para:

- ✅ Gerenciamento de processos e hierarquias
- ✅ Armazenamento e edição de diagramas BPMN (XML)
- ✅ Gestão de metadados com classificação LGPD
- ✅ Autenticação JWT flexível (pode ser desabilitada)
- ✅ Dashboard com estatísticas
- ✅ Busca avançada em múltiplas tabelas

### Porta e Documentação

| Recurso | URL |
|---------|-----|
| API Base | `http://localhost:8000` |
| Swagger UI | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **FastAPI** | 0.100+ | Framework web assíncrono |
| **SQLAlchemy** | 2.x | ORM para banco de dados |
| **PostgreSQL** | 14+ | Banco de dados relacional |
| **Pydantic** | 2.x | Validação de dados |
| **python-jose** | - | Tokens JWT |
| **passlib** | - | Hash de senhas (bcrypt) |
| **python-multipart** | - | Upload de arquivos |

---

## 📁 Estrutura de Pastas

```
api_domestica/
├── app/
│   ├── main.py          # Aplicação principal + rotas
│   ├── database.py      # Modelos SQLAlchemy + conexão
│   ├── schemas.py       # Schemas Pydantic (validação)
│   ├── auth.py          # Autenticação JWT
│   ├── canvas.py        # Endpoints do Canvas BPMN
│   ├── dashboard.py     # Endpoint de dashboard
│   ├── xbanco.py        # Busca avançada no banco
│   ├── gemini.py        # Integração com IA (Gemini)
│   ├── utils.py         # Funções utilitárias
│   └── email.py         # Serviço de email
│
├── uploads/             # Arquivos enviados pelo canvas
├── .env                 # Variáveis de ambiente
├── requirements.txt     # Dependências Python
└── Dockerfile
```

---

## 🗃️ Modelos de Dados

### Diagrama de Entidades

```
┌─────────────────────┐
│    MacroProcesso    │
│─────────────────────│
│ id (PK)             │
│ titulo              │
│ data_publicacao     │
│ data_criacao        │
└─────────┬───────────┘
          │ 1
          │
          │ N
┌─────────────────────────────┐
│  MacroProcessoProcesso      │ (Tabela de Junção)
│─────────────────────────────│
│ id (PK)                     │
│ macro_processo_id (FK)      │───────┐
│ processo_id (FK)            │───┐   │
│ ordem                       │   │   │
└─────────────────────────────┘   │   │
                                  │   │
          ┌───────────────────────┘   │
          │                           │
          │ N                         │
┌─────────────────────┐               │
│      Processo       │◄──────────────┘
│─────────────────────│
│ id (PK)             │
│ id_pai (FK self)    │◄─┐ (hierarquia)
│ id_area (FK)        │  │
│ ordem               │  │
│ titulo              │──┘
│ data_publicacao     │
│ data_criacao        │
└─────────┬───────────┘
          │ 1
          │
          │ N
┌─────────────────────┐
│        Mapa         │
│─────────────────────│
│ id (PK)             │
│ id_proc (FK)        │──► Processo
│ titulo              │
│ status              │
│ XML                 │ (diagrama BPMN)
│ data_criacao        │
│ data_modificacao    │
└─────────┬───────────┘
          │ 1
          │
          │ N
┌─────────────────────┐
│     Metadados       │
│─────────────────────│
│ id (PK)             │
│ id_processo         │──► Mapa.id (NÃO Processo!)
│ id_atividade        │ (ID do elemento BPMN)
│ nome                │
│ lgpd                │ (public/confidential/anonymized)
│ dados (JSON)        │ (array de strings)
└─────────────────────┘
```

### Detalhes dos Modelos

#### MacroProcesso
```python
class MacroProcesso(Base):
    __tablename__ = "macro_processos"
    
    id = Column(Integer, primary_key=True)
    titulo = Column(String(200), nullable=False)
    data_publicacao = Column(Date)
    data_criacao = Column(DateTime, default=datetime.utcnow)
```

#### Processo
```python
class Processo(Base):
    __tablename__ = "processos"
    
    id = Column(Integer, primary_key=True)
    id_pai = Column(Integer, ForeignKey('processos.id'), nullable=True)  # Self-ref
    id_area = Column(Integer, nullable=True)
    ordem = Column(Integer, nullable=True)
    titulo = Column(String(200), nullable=False)
    data_publicacao = Column(Date)
    data_criacao = Column(DateTime, default=datetime.utcnow)
```

#### Mapa
```python
class Mapa(Base):
    __tablename__ = 'mapas'
    
    id = Column(Integer, primary_key=True)
    id_proc = Column(Integer)  # FK para Processo
    titulo = Column(String(200), nullable=False)
    status = Column(String(50), default="Em andamento")  # Concluído, Em andamento, Pendente
    XML = Column(String)  # Diagrama BPMN em XML
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_modificacao = Column(DateTime, onupdate=datetime.utcnow)
```

#### Metadados
```python
class Metadados(Base):
    __tablename__ = "metadados"
    
    id = Column(Integer, primary_key=True)
    id_processo = Column(Integer)      # ⚠️ ATENÇÃO: Referencia Mapa.id, NÃO Processo.id
    id_atividade = Column(String(100)) # ID do elemento BPMN (ex: Activity_1abc123)
    nome = Column(String(100))         # Nome da atividade
    lgpd = Column(String(100))         # public, confidential, anonymized
    dados = Column(JSON)               # Array de strings ["CPF", "Nome", "Email"]
```

---

## 🔗 Relacionamentos entre Entidades

### Hierarquia Completa

```
MacroProcesso (Cadeia de Valor)
    │
    └──► [MacroProcessoProcesso] ◄── Tabela de junção N:N
              │
              └──► Processo (Processo de negócio)
                      │
                      ├──► Processo (Subprocesso - via id_pai)
                      │       └──► Mapa
                      │
                      └──► Mapa (Diagrama BPMN)
                              │
                              └──► Metadados (por atividade BPMN)
```

### Explicação dos Relacionamentos

| Relação | Tipo | Descrição |
|---------|------|-----------|
| MacroProcesso → Processo | N:N | Via tabela `MacroProcessoProcesso` |
| Processo → Processo | 1:N | Self-reference via `id_pai` (subprocessos) |
| Processo → Mapa | 1:N | Um processo pode ter vários mapas |
| Mapa → Metadados | 1:N | Um mapa tem metadados por atividade BPMN |

### ⚠️ ATENÇÃO: id_processo em Metadados

O campo `id_processo` na tabela `Metadados` referencia o **ID do Mapa**, não o ID do Processo! Isso porque os metadados são associados a atividades específicas dentro de um diagrama BPMN (Mapa).

```
Metadados.id_processo  ══►  Mapa.id  (NÃO Processo.id)
```

---

## 🌐 Endpoints da API

### Autenticação

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `POST` | `/register` | Cadastrar novo usuário | ✅ |
| `POST` | `/login` | Fazer login (retorna JWT) | ✅ |
| `GET` | `/auth/status` | Verifica se auth está habilitada | ✅ |

### MacroProcessos

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/macroprocessos/` | Lista todos macroprocessos | ✅ |
| `GET` | `/macroprocessos/{id}` | Busca macroprocesso por ID | |
| `POST` | `/macroprocessos/` | Cria novo macroprocesso | ✅ |
| `PUT` | `/macroprocessos/{id}` | Atualiza macroprocesso | |
| `DELETE` | `/macroprocessos/{id}` | Deleta macroprocesso | ✅ |

**Payload POST/PUT:**
```json
{
  "titulo": "Cadeia de Valor",
  "data_publicacao": "2024-01-01"
}
```

### Processos

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/processos/` | Lista todos processos | ✅ |
| `GET` | `/processos/{id}` | Busca processo por ID | |
| `GET` | `/processos/{id}/filhos` | Busca subprocessos | |
| `POST` | `/processos/` | Cria novo processo | ✅ |
| `PUT` | `/processos/{id}` | Atualiza processo | |
| `PUT` | `/processos/{id}/move` | Move processo para outro local | ✅ |
| `DELETE` | `/processos/{id}` | Deleta processo (cascata) | ✅ |

**Payload POST:**
```json
{
  "titulo": "Gestão de Compras",
  "id_pai": null,
  "id_area": null,
  "ordem": 1,
  "data_publicacao": "2024-01-01"
}
```

**Payload MOVE:**
```json
{
  "target_macro_id": 1,        // Mover para macroprocesso
  "target_processo_id": null,  // OU mover como subprocesso
  "ordem": 1
}
```

### Mapas (Diagramas BPMN)

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/mapas/` | Lista todos mapas | |
| `GET` | `/mapas/{id}` | Busca mapa por ID | |
| `GET` | `/mapas/xml/{id}` | Retorna XML do mapa | |
| `POST` | `/mapas/` | Cria novo mapa | ✅ |
| `PUT` | `/mapas/{id}` | Atualiza mapa | |
| `PUT` | `/mapas/{id}/move` | Move mapa para outro processo | ✅ |
| `PATCH` | `/mapas/{id}/status` | Atualiza status | |
| `DELETE` | `/mapas/{id}` | Deleta mapa | ✅ |

**Payload POST:**
```json
{
  "id_proc": 1,
  "titulo": "Fluxo de Compras",
  "XML": "<?xml ...>",
  "status": "Em andamento"
}
```

### Canvas (Endpoints específicos para o editor BPMN)

| Método | Endpoint | Descrição | Usado pelo Canvas |
|--------|----------|-----------|:-----------------:|
| `GET` | `/canvas/view/{id}` | Carrega XML para visualização | ✅ |
| `GET` | `/canvas/edit/{id}` | Carrega XML para edição | ✅ |
| `PUT` | `/canvas/save/{id}` | Salva XML editado | ✅ |
| `POST` | `/canvas/upload` | Upload de arquivo anexo | ✅ |

**Query Param SAVE:**
```
PUT /canvas/save/1?xml_content=<encoded_xml>
```

### Metadados

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/todos-metadados/` | Lista todos metadados | |
| `GET` | `/metadados/buscar/?termo=X` | Busca metadados | ✅ |
| `POST` | `/metadados/` | Cria/atualiza metadado | ✅ (Canvas) |
| `PUT` | `/metadados/{id}` | Atualiza metadado | |

**Payload POST (usado pelo Canvas ao salvar):**
```json
{
  "id_processo": 1,         // ID do MAPA (não do processo!)
  "id_atividade": "Activity_1abc123",
  "nome": "Validar Dados",
  "lgpd": "confidential",
  "dados": ["CPF", "Nome", "Email"]
}
```

**Resposta da Busca:**
```json
{
  "metadados": [
    {
      "id": 1,
      "nome": "Validar Dados",
      "dados": ["CPF", "Nome"],
      "lgpd": "confidential",
      "id_processo": 1,
      "id_atividade": "Activity_1abc123",
      "mapa_titulo": "Fluxo de Compras",
      "processo_nome": "Gestão de Compras"
    }
  ]
}
```

### Hierarquia Completa

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/hierarchy/` | Retorna árvore completa | ✅ |

**Resposta:**
```json
{
  "hierarchy": [
    {
      "id": 1,
      "titulo": "Cadeia de Valor",
      "type": "macro",
      "children": [
        {
          "id": 1,
          "titulo": "Gestão de Compras",
          "type": "process",
          "data_criacao": "2024-01-01T00:00:00",
          "children": [
            {
              "id": 1,
              "titulo": "Fluxo de Compras",
              "type": "map",
              "proc_id": 1,
              "data_criacao": "2024-01-01T00:00:00"
            }
          ]
        }
      ]
    }
  ]
}
```

### Dashboard

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/dashboard/` | Estatísticas gerais | ✅ |
| `GET` | `/dashboard/?status=X` | Filtra por status | ✅ |

**Resposta:**
```json
{
  "stats": {
    "totalProcessos": 10,
    "statusCounts": {
      "Concluído": 3,
      "Em andamento": 5,
      "Pendente": 2
    }
  },
  "processosRecentes": [
    {
      "id": 1,
      "titulo": "Gestão de Compras",
      "status": "Em andamento",
      "dataModificacao": "2024-01-01T12:00:00"
    }
  ]
}
```

### Busca Avançada

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/banco/busca-geral/?q=X` | Busca em múltiplas tabelas | ✅ |
| `GET` | `/banco/busca-por-metadados/?q=X` | Busca nos dados dos metadados | |
| `GET` | `/banco/teste-metadados/` | Debug de metadados | |

### Associações MacroProcesso-Processo

| Método | Endpoint | Descrição | Usado pelo Frontend |
|--------|----------|-----------|:-------------------:|
| `GET` | `/macroprocesso_processos/` | Lista associações | |
| `POST` | `/macroprocesso_processos/` | Cria associação | ✅ |
| `GET` | `/macroprocessos/{id}/processos/` | Processos de um macro | |

---

## 🔐 Sistema de Autenticação

### Configuração

A autenticação pode ser habilitada/desabilitada via variável de ambiente:

```env
AUTH_ENABLED=true   # Produção
AUTH_ENABLED=false  # Desenvolvimento
```

### Fluxo de Autenticação

```
┌─────────────┐      POST /login       ┌─────────────┐
│   Frontend  │ ─────────────────────► │     API     │
│             │  {email, senha}        │             │
└─────────────┘                        └──────┬──────┘
       ▲                                      │
       │      {access_token: "jwt..."}        │
       └──────────────────────────────────────┘
       
       
┌─────────────┐  GET /endpoint          ┌─────────────┐
│   Frontend  │ ─────────────────────► │     API     │
│             │ Authorization: Bearer   │             │
└─────────────┘ jwt...                  └─────────────┘
```

### Modo Desenvolvimento (AUTH_ENABLED=false)

Quando desabilitado, a API aceita todas as requisições e retorna um usuário fictício:

```python
{
  "id": 1,
  "nome": "Usuário Padrão",
  "email": "admin@xmap.com"
}
```

### Funções de Auth (auth.py)

```python
# Gerar hash de senha
gerar_hash_senha(senha: str) -> str

# Verificar senha
verificar_senha(senha_plana: str, senha_hash: str) -> bool

# Criar token JWT
criar_token_acesso(data: dict, expires_delta: timedelta = None) -> str

# Dependency - obter usuário atual
get_current_active_user(token: str) -> Usuario
```

---

## ⚙️ Variáveis de Ambiente

Criar arquivo `.env` na pasta `api_domestica/`:

```env
# Banco de Dados
DB_HOST=db
DB_PORT=5432
DB_NAME=sucu_db
DB_USER=sucupira
DB_PASSWORD=12345

# Autenticação
AUTH_ENABLED=true
SECRET_KEY=sua-chave-secreta-super-forte

# API
DEBUG=true
```

---

## 🔧 Guia de Modificações

### 1. Adicionar Nova Tabela

#### Passo 1: Criar modelo em database.py
```python
class MinhaEntidade(Base):
    __tablename__ = "minha_entidade"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    ativo = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.datetime.utcnow)
```

#### Passo 2: Criar schema em schemas.py
```python
class MinhaEntidadeCreate(BaseModel):
    nome: str
    ativo: Optional[bool] = True

class MinhaEntidadeOut(BaseModel):
    id: int
    nome: str
    ativo: bool
    
    class Config:
        from_attributes = True
```

#### Passo 3: Criar endpoints em main.py
```python
from .database import MinhaEntidade
from .schemas import MinhaEntidadeCreate, MinhaEntidadeOut

@app.post("/minha-entidade/", response_model=MinhaEntidadeOut)
async def create_entidade(data: MinhaEntidadeCreate, db: Session = Depends(get_db)):
    entidade = MinhaEntidade(**data.dict())
    db.add(entidade)
    db.commit()
    db.refresh(entidade)
    return entidade

@app.get("/minha-entidade/")
async def list_entidades(db: Session = Depends(get_db)):
    return {"entidades": db.query(MinhaEntidade).all()}
```

### 2. Adicionar Campo a Tabela Existente

#### Passo 1: Adicionar coluna em database.py
```python
class Processo(Base):
    # ... campos existentes
    responsavel = Column(String(100), nullable=True)  # Novo campo
```

#### Passo 2: Atualizar schema
```python
class ProcessoCreate(BaseModel):
    titulo: str
    responsavel: Optional[str] = None  # Novo campo
```

#### Passo 3: Recriar tabelas (CUIDADO: perde dados!)
```python
# Em main.py, no startup
drop_and_create_all_tables()
```

**OU** usar migrations com Alembic (recomendado para produção).

### 3. Adicionar Novo Router (módulo)

#### Passo 1: Criar arquivo do router
```python
# app/meu_modulo.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .database import get_db

router = APIRouter(prefix="/meu-modulo", tags=["Meu Módulo"])

@router.get("/")
async def minha_funcao(db: Session = Depends(get_db)):
    return {"status": "ok"}
```

#### Passo 2: Registrar em main.py
```python
from . import meu_modulo

app.include_router(meu_modulo.router)
```

### 4. Proteger Endpoint com Autenticação

```python
from .auth import get_current_active_user

@app.get("/endpoint-protegido/")
async def endpoint_protegido(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return {"user": current_user.nome}
```

### 5. Adicionar Nova Classificação LGPD

Os valores LGPD são strings livres no banco, mas convencionalmente:

- `public` - Público
- `confidential` - Confidencial
- `anonymized` - Anonimizado

Para adicionar nova classificação, basta usar no Canvas (SpellProps.js) e a API aceitará.

---

## 🚀 Executando a API

### Desenvolvimento Local

```bash
cd api_domestica
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```bash
docker build -t xmap-api .
docker run -p 8000:8000 xmap-api
```

### Testando Endpoints

```bash
# Health check
curl http://localhost:8000/

# Listar processos
curl http://localhost:8000/processos/

# Buscar metadados
curl "http://localhost:8000/metadados/buscar/?termo=cpf"

# Hierarquia completa
curl http://localhost:8000/hierarchy/
```

---

## 📝 Resumo: Endpoints Usados pelo Frontend

### ProcessCanvas.tsx / ProcessTreeView.tsx
```
GET    /hierarchy/
POST   /macroprocessos/
DELETE /macroprocessos/{id}
POST   /processos/
DELETE /processos/{id}
PUT    /processos/{id}/move
POST   /mapas/
DELETE /mapas/{id}
PUT    /mapas/{id}/move
POST   /macroprocesso_processos/
```

### Dashboard.tsx
```
GET    /dashboard/
GET    /dashboard/?status={status}
```

### SearchBar.tsx
```
GET    /metadados/buscar/?termo={termo}
```

### LoginPage.tsx / auth.tsx
```
POST   /login
POST   /register
GET    /auth/status
```

### Canvas (bpmn.io)
```
GET    /canvas/view/{id}
GET    /canvas/edit/{id}
PUT    /canvas/save/{id}?xml_content={xml}
POST   /canvas/upload
POST   /metadados/
```

---

## 🔗 Links Úteis

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Pydantic V2](https://docs.pydantic.dev/latest/)
- [JWT Authentication](https://jwt.io/)

---

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2024
