# xMap Modeler - Sistema de Modelagem de Processos

Sistema completo de modelagem e gestão de processos empresariais com interface web moderna e API robusta.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Executar](#como-executar)
- [Acesso aos Serviços](#acesso-aos-serviços)
- [Configurações](#configurações)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Troubleshooting](#troubleshooting)
- [Contribuição](#contribuição)

## 🎯 Visão Geral

O xMap Modeler é uma plataforma completa para:
- ✅ Modelagem de processos empresariais
- ✅ Gestão de metadados e conformidade LGPD
- ✅ Interface de busca inteligente
- ✅ Canvas interativo para visualização
- ✅ Sistema de autenticação flexível
- ✅ API RESTful completa

## 🏗️ Arquitetura do Sistema

```
       ┌─────────────────┐              ┌─────────────────┐
       │   Frontend UI   │              │     Canvas      │
       │   (Port 4500)   │              │   (Port 8080)   │
       │     React       │              │     React       │
       └─────────┬───────┘              └─────────┬───────┘
                 │                                │
                 └────────────────┬───────────────┘
                                  │
                       ┌─────────────────┐
                       │   API Backend   │
                       │   (Port 8000)   │
                       │     FastAPI     │
                       └─────────┬───────┘
                                 │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
   │   PostgreSQL    │  │     PgAdmin     │  │   Volumes       │
   │   (Port 5432)   │  │   (Port 5050)   │  │   Persistentes  │
   │    Database     │  │   Web Admin     │  │                 │
   └─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🔧 Pré-requisitos

### Software Obrigatório

#### 1. Docker & Docker Compose
```bash
# Verificar se está instalado
docker --version
docker-compose --version

# Versões mínimas recomendadas
Docker: 20.10.0+
Docker Compose: 2.0.0+
```

**Instalação:**
- **macOS:** [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
- **Windows:** [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  ```

#### 2. Git
```bash
# Verificar instalação
git --version

# Versão mínima: 2.20.0+
```

### Recursos do Sistema

| Componente | RAM Mínima | RAM Recomendada | Espaço em Disco |
|------------|------------|----------------|-----------------|
| PostgreSQL | 512MB | 1GB | 2GB |
| API (FastAPI) | 256MB | 512MB | 1GB |
| Frontend (2x React) | 384MB | 768MB | 1.5GB |
| PgAdmin | 128MB | 256MB | 500MB |
| **TOTAL** | **1.3GB** | **2.5GB** | **5GB** |

### Portas Necessárias

Certifique-se de que estas portas estão disponíveis:
- `4500` - Frontend UI
- `5432` - PostgreSQL
- `5050` - PgAdmin
- `8000` - API Backend
- `8080` - Canvas

## 🚀 Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone https://github.com/joaosucupira/xmap-modeler
cd xmap-modeler
```

### 2. Configuração do Ambiente

#### Backend (API)
```bash
# Criar arquivo de configuração da API
cp api_domestica/.env.example api_domestica/.env
```

Edite o arquivo `api_domestica/.env`:
```env
# Configurações do Banco de Dados
DB_HOST=db
DB_PORT=5432
DB_NAME=sucu_db
DB_USER=sucupira
DB_PASSWORD=12345

# Configurações de Autenticação
AUTH_ENABLED=true
SECRET_KEY=sua-chave-secreta-super-forte-aqui

# Configurações da API
DEBUG=true
CORS_ORIGINS=["http://localhost:4500","http://localhost:8080"]
```

#### Frontend
Os frontends são configurados automaticamente via variáveis de ambiente no Docker Compose.

### 3. Verificar Configurações
```bash
# Verificar se todos os arquivos estão presentes
ls -la
# Deve mostrar: api_domestica/, ui_xmap/, interface_domestica/, canvas/, docker-compose.yml

# Verificar estrutura da API
ls -la api_domestica/
# Deve conter: app/, Dockerfile, requirements.txt, .env
```

## 🎮 Como Executar

### Execução Completa (Recomendado)
```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou executar em background
docker-compose up --build -d
```

### Execução Seletiva
```bash
# Apenas banco de dados
docker-compose up db

# Banco + API
docker-compose up db api

# Todos exceto canvas
docker-compose up db api ui interface pgadmin
```

### Primeira Execução
```bash
# 1. Subir apenas o banco primeiro
docker-compose up -d db

# 2. Aguardar 10 segundos para o banco inicializar
sleep 10

# 3. Subir a API para criar as tabelas
docker-compose up -d api

# 4. Verificar se as tabelas foram criadas
docker exec xapi_server python -c "
from app.database import check_tables
tables = check_tables()
print(f'Tabelas criadas: {len(tables)}')
print('Tabelas:', tables)
"

# 5. Subir todos os demais serviços
docker-compose up -d
```

## 🌐 Acesso aos Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend UI** | http://localhost:4500 | Interface principal do sistema |
| **Canvas** | http://localhost:8080 | Canvas de modelagem |
| **API Documentation** | http://localhost:8000/docs | Documentação interativa da API |
| **PgAdmin** | http://localhost:5050 | Administração do banco |

### Credenciais Padrão

#### PgAdmin
- **Email:** admin@admin.com
- **Senha:** admin

#### Banco de Dados (para PgAdmin)
- **Host:** db (ou localhost se acessando externamente)
- **Porta:** 5432
- **Database:** sucu_db
- **Usuário:** sucupira
- **Senha:** 12345

## ⚙️ Configurações

### Autenticação

#### Ativar/Desativar Login
```bash
# Desativar autenticação (modo desenvolvimento)
echo "AUTH_ENABLED=false" >> api_domestica/.env

# Ativar autenticação (modo produção)
echo "AUTH_ENABLED=true" >> api_domestica/.env

# Reiniciar API para aplicar mudanças
docker-compose restart api
```

### Banco de Dados

#### Resetar Banco Completo
```bash
# Parar tudo
docker-compose down

# Remover volume do banco (ATENÇÃO: Remove todos os dados!)
docker volume rm xmap-modeler_pg_data_volume

# Subir novamente
docker-compose up -d
```

#### Criar Tabelas Manualmente
```bash
docker exec xapi_server python -c "
from app.database import create_all_tables
create_all_tables()
print('Tabelas criadas com sucesso!')
"
```

### Performance

#### Ajustar Recursos do Docker
```yaml
# Adicionar ao docker-compose.yml em cada serviço
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
```

## 📁 Estrutura do Projeto

```
xmap-modeler/
├── 📁 api_domestica/          # Backend FastAPI
│   ├── 📁 app/
│   │   ├── main.py           # Aplicação principal
│   │   ├── database.py       # Modelos e conexão BD
│   │   ├── auth.py          # Sistema de autenticação
│   │   ├── schemas.py       # Validação de dados
│   │   └── xbanco.py        # Endpoints de busca
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env                 # Configurações
├── 📁 ui_xmap/               # Frontend principal (React)
│   ├── 📁 src/
│   │   ├── 📁 components/    # Componentes reutilizáveis
│   │   ├── 📁 pages/        # Páginas da aplicação
│   │   └── 📁 services/     # Serviços de API
│   ├── package.json
│   └── Dockerfile
├── 📁 interface_domestica/   # Interface alternativa
├── 📁 canvas/               # Canvas de modelagem
├── docker-compose.yml       # Orquestração dos serviços
└── README.md               # Este arquivo
```

## 👨‍💻 Desenvolvimento

### Comandos Úteis

#### Logs
```bash
# Ver logs de todos os serviços
docker-compose logs

# Logs de um serviço específico
docker-compose logs api
docker-compose logs ui

# Seguir logs em tempo real
docker-compose logs -f api
```

#### Acesso aos Containers
```bash
# Acessar container da API
docker exec -it xapi_server bash

# Acessar container do frontend
docker exec -it ui_xmap sh

# Acessar banco de dados
docker exec -it xmap_server psql -U sucupira -d sucu_db
```

#### Rebuild Seletivo
```bash
# Rebuild apenas a API
docker-compose build api
docker-compose up -d api

# Rebuild apenas frontend
docker-compose build ui
docker-compose up -d ui
```

### Hot Reload

Todos os frontends têm hot reload ativado automaticamente. Para a API:
```bash
# A API já está configurada com --reload
# Mudanças em arquivos Python são detectadas automaticamente
```

### Testando a API
```bash
# Testar endpoints
curl http://localhost:8000/health
curl http://localhost:8000/processos/
curl "http://localhost:8000/banco/busca-geral/?q=teste"

# Via interface web
open http://localhost:8000/docs
```

## 🔧 Troubleshooting

### Problemas Comuns

#### Porta já em uso
```bash
# Verificar portas em uso
lsof -i :8000
lsof -i :4500

# Parar processo que está usando a porta
kill -9 PID_DO_PROCESSO
```

#### Containers não sobem
```bash
# Verificar status
docker-compose ps

# Logs detalhados
docker-compose logs --tail=50 nome_do_servico

# Rebuild forçado
docker-compose down
docker-compose build --no-cache
docker-compose up
```

#### Banco não conecta
```bash
# Verificar se PostgreSQL está rodando
docker exec xmap_server pg_isready -U sucupira

# Testar conexão manualmente
docker exec -it xmap_server psql -U sucupira -d sucu_db -c "SELECT 1;"
```

#### Erro de permissões (Linux)
```bash
# Ajustar permissões dos volumes
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

### Comandos de Diagnóstico
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Verificar redes
docker network ls

# Verificar volumes
docker volume ls

# Limpar sistema Docker (CUIDADO!)
docker system prune -a
```

## 🤝 Contribuição

### Setup para Desenvolvimento
```bash
# 1. Fork do repositório
# 2. Clone seu fork
git clone https://github.com/seu-usuario/xmap-modeler.git

# 3. Criar branch para feature
git checkout -b feature/nova-funcionalidade

# 4. Desenvolver e testar
docker-compose up --build

# 5. Commit e push
git add .
git commit -m "Adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade

# 6. Criar Pull Request
```

### Padrões de Código
- **Backend:** Python com FastAPI, SQLAlchemy
- **Frontend:** React com TypeScript, Tailwind CSS
- **Commits:** Conventional Commits
- **Testes:** Pytest para backend, Jest para frontend

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/seu-usuario/xmap-modeler/issues)
- **Documentação:** http://localhost:8000/docs (quando rodando)
- **Wiki:** [GitHub Wiki](https://github.com/seu-usuario/xmap-modeler/wiki)

---

**Versão:** 1.0.0  
**Última atualização:** Outubro 2024  
**Licença:** MIT