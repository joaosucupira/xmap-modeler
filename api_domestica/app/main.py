# api_domestica/app/main.py
# (Modified to add /hierarchy/ endpoint)

from fastapi import FastAPI, Depends, HTTPException,status
from sqlalchemy.orm import Session

from .database import Metadados, create_all_tables, drop_and_create_all_tables,get_db, Usuario, Item, Processo, Mapa, Area, Documento, MacroProcesso, MacroProcessoProcesso
from fastapi.middleware.cors import CORSMiddleware
from .utils import validate_entity
from fastapi.responses import Response
from .schemas import UsuarioCreate,UsuarioLogin,UsuarioOut,MetadadosBase,MetadadosCreate,MetadadosResponse
from fastapi.staticfiles import StaticFiles 
from typing import List
from pydantic import BaseModel
from sqlalchemy import String  # Add this import
from .auth import AUTH_ENABLED, get_current_active_user

from .auth import gerar_hash_senha, verificar_senha, criar_token_acesso

from . import xbanco, dashboard
from . import gemini
from . import canvas
app = FastAPI()


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4500",
    "http://127.0.0.1:4500",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://host.docker.internal:4500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,  
    allow_methods=["*"],  
    allow_headers=["*"], 
)

# Endpoints
app.include_router(xbanco.router)
app.include_router(gemini.router)   
app.include_router(canvas.router)
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# startup da aplicação
@app.on_event("startup")
def on_startup():
    
   create_all_tables()
   #drop_and_create_all_tables() # CUIDADO! Isto irá apagar todos os dados existentes e criar as tabelas novamente.
   pass
# Endpoints
@app.get("/")
async def read_root():
    return {"message": "API UHU!"}

# Teste
@app.get("/usuarios/")
async def get_users_data(db: Session = Depends(get_db)):
    users = db.query(Usuario).all()
    return {"usuarios": [{"id": user.id, "nome": user.nome} for user in users]}

@app.get("/items/")
async def get_items_data(db: Session = Depends(get_db)):
    items = db.query(Item).all()
    return {"items": [{"id": item.id, "nome_item": item.nome_item} for item in items]}

# ... código existente ...

@app.post("/register", response_model=UsuarioOut)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    try:
        # Verificar se usuário já existe
        usuario_existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
        if usuario_existente:
            raise HTTPException(status_code=400, detail="Email já registrado")
        
        # Validações adicionais
        if not usuario.nome or not usuario.nome.strip():
            raise HTTPException(status_code=400, detail="Nome é obrigatório")
        
        if not usuario.email or not usuario.email.strip():
            raise HTTPException(status_code=400, detail="Email é obrigatório")
        
        # Criar novo usuário (a validação da senha é feita em gerar_hash_senha)
        novo_usuario = Usuario(
            nome=usuario.nome.strip(),
            email=usuario.email.strip().lower(),
            senha_hash=gerar_hash_senha(usuario.senha)
        )
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        return novo_usuario
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao registrar usuário: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor")

@app.post("/login")
def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    try:
        db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email.strip().lower()).first()
        if not db_usuario or not verificar_senha(usuario.senha, db_usuario.senha_hash):
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        token = criar_token_acesso(data={"sub": db_usuario.email})
        return {"access_token": token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro no login: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")


@app.post("/usuarios/")
async def create_user(nome: str, db: Session = Depends(get_db)):

    if not nome.strip():
        raise HTTPException(status_code=400, detail="O nome não pode ser vazio ou conter apenas espaços.")

    user = Usuario(nome=nome.strip()) 
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Usuário criado com sucesso!", "usuario": {"id": user.id, "nome": user.nome}}

# Processos
@app.post("/processos/")
async def create_processo(id_pai: int = None, id_area: int = None, ordem: int = None, titulo: str = None, data_publicacao: str = None, db: Session = Depends(get_db)):
    proc = Processo(id_pai=id_pai, id_area=id_area, ordem=ordem, titulo=titulo)
    db.add(proc)
    db.commit()
    db.refresh(proc)
    return {"message": "Processo criado com sucesso!", "processo": {"id": proc.id, "id_pai": proc.id_pai, "id_area": proc.id_area, "ordem": proc.ordem, "titulo": proc.titulo, "data_publicacao": proc.data_publicacao}}

@app.get("/processos/")
async def get_processos(db: Session = Depends(get_db)):
    processos = db.query(Processo).all()
    return {"processos": [{"id": proc.id, "id_pai": proc.id_pai, "id_area": proc.id_area, "ordem": proc.ordem, "titulo": proc.titulo, "data_publicacao": proc.data_publicacao, "data_criacao": proc.data_criacao} for proc in processos]}

@app.get("/processos/{processo_id}")
async def get_processo(processo_id: int, db: Session = Depends(get_db)):
    # proc = db.query(Processo).filter(Processo.id == processo_id).first() 
    proc = validate_entity(db, processo_id, Processo)
    return {"processo": {"id": proc.id, "id_pai": proc.id_pai, "id_area": proc.id_area, "ordem": proc.ordem, "titulo": proc.titulo, "data_publicacao": proc.data_publicacao}}

@app.get("/processos/{processo_id}/{filhos}")
async def get_processo_filhos(processo_id: int, filhos: bool = False, db: Session = Depends(get_db)):
    if filhos:
        filhos_list = db.query(Processo).filter(Processo.id_pai == processo_id).all()
        filhos_sorted = sorted(filhos_list, key=lambda f: f.ordem or 0)
        return {"filhos": [{"id": filho.id, "id_pai": filho.id_pai, "id_area": filho.id_area, "ordem": filho.ordem, "titulo": filho.titulo, "data_publicacao": filho.data_publicacao, "data_criacao": filho.data_criacao} for filho in filhos_sorted]}
    return []

@app.delete("/processos/{processo_id}")
async def delete_processo(processo_id: int, db: Session = Depends(get_db)):
    # proc = db.query(Processo).filter(Processo.id == processo_id).first()
    # if not proc:
    #     raise HTTPException(status_code=404, detail="Processo não encontrado.")
    proc = validate_entity(db, processo_id, Processo)
    db.delete(proc)
    db.commit()
    return {"message": "Processo deletado com sucesso!"}

@app.put("/processos/{processo_id}")
async def update_processo(processo_id: int, id_pai: int = None, id_area: int = None, ordem: int = None, titulo: str = None, data_publicacao: str = None, db: Session = Depends(get_db)):
    # proc = db.query(Processo).filter(Processo.id == processo_id).first()
    # if not proc:
    #     raise HTTPException(status_code=404, detail="Processo não encontrado.")
    proc = validate_entity(db, processo_id, Processo)
    if id_pai is not None:
        proc.id_pai = id_pai
    if id_area is not None:
        proc.id_area = id_area
    if ordem is not None:
        proc.ordem = ordem
    if titulo is not None:
        proc.titulo = titulo
    if data_publicacao is not None:
        proc.data_publicacao = data_publicacao
    db.commit()
    db.refresh(proc)
    return {"message": "Processo atualizado com sucesso!", "processo": {"id": proc.id, "id_pai": proc.id_pai, "id_area": proc.id_area, "ordem": proc.ordem, "titulo": proc.titulo, "data_publicacao": proc.data_publicacao}}


# Mapas
@app.post("/mapas/")
async def create_mapa(
    id_proc: int, 
    titulo: str = None,  # Tornar opcional com valor padrão
    XML: str = "", 
    db: Session = Depends(get_db)
):
    # Se não passar título, gerar automaticamente
    if not titulo or not titulo.strip():
        # Buscar o processo para pegar o título
        processo = db.query(Processo).filter(Processo.id == id_proc).first()
        if processo and processo.titulo:
            titulo = f"Mapa - {processo.titulo}"
        else:
            titulo = f"Mapa do Processo #{id_proc}"
    
    mapa = Mapa(id_proc=id_proc, titulo=titulo, XML=XML)
    db.add(mapa)
    db.commit()
    db.refresh(mapa)
    
    return {
        "message": "Mapa criado com sucesso!", 
        "mapa": {
            "id": mapa.id, 
            "id_proc": mapa.id_proc, 
            "titulo": mapa.titulo, 
            "XML": mapa.XML
        }
    }
@app.get("/mapas/")
async def get_mapas(db: Session = Depends(get_db)):
    mapas = db.query(Mapa).all()
    return {"mapas": [{"id": mapa.id, "id_proc": mapa.id_proc, "XML": mapa.XML, "titulo": mapa.titulo} for mapa in mapas]}

@app.get("/mapas/{mapa_id}")
async def get_mapa(mapa_id: int, db:Session = Depends(get_db)):
    # mapa = db.query(Mapa).filter(Mapa.id == mapa_id).first
    mapa = validate_entity(db, mapa_id, Mapa)
    return {"mapa": {
        "id": mapa.id,
        "proc_id": mapa.id_proc,
        "XML": mapa.XML ,
        "titulo": mapa.titulo
        }}

@app.get("/mapas/xml/{mapa_id}")
async def get_mapa_xml(mapa_id: int, db: Session = Depends(get_db)):

    mapa = validate_entity(db, mapa_id, Mapa)

    return Response(content=mapa.XML, media_type="application/xml")


@app.get("/documentos/")
async def get_documentos(db: Session = Depends(get_db)):
    #documentos = db.query(Documentos).all() lembra de descomentar quando for usar
   # return {"documentos": [{"id": doc.id, "id_proc": doc.id_proc, "nome_documento": doc.nome_documento, "link": doc.link} for doc in documentos]}
    pass

@app.post("/documentos/")
async def create_documento(id_proc: int, nome_documento: str, link: str, db: Session = Depends(get_db)):
    doc = Documento(id_proc=id_proc, nome_documento=nome_documento, link=link)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"message": "Documento criado com sucesso!", "documento": {"id": doc.id, "id_proc": doc.id_proc, "nome_documento": doc.nome_documento, "link": doc.link}}


@app.get("/areas/")
async def get_areas(db: Session = Depends(get_db)):
    areas = db.query(Area).all()
    return {"areas": [{"id": area.id, "nome_area": area.nome_area, "sigla": area.sigla, "tipo": area.tipo} for area in areas]}

@app.post("/areas/")
async def create_area(nome_area: str, sigla: str, tipo: str, db: Session = Depends(get_db)):
    area = Area(nome_area=nome_area, sigla=sigla, tipo=tipo)
    db.add(area)
    db.commit()
    db.refresh(area)
    return {"message": "Area criada com sucesso!", "area": {"id": area.id, "nome_area": area.nome_area, "sigla": area.sigla, "tipo": area.tipo}}

@app.delete("/areas/{area_id}")
async def delete_area(area_id: int, db:Session = Depends(get_db)):
    area = validate_entity(db, area_id, Area)
    db.delete(area)
    db.commit()
    return {"message": "Area deletada com sucesso!"}



class MetadadosOut(BaseModel):
    id: int
    nome: str
    dados: List[str]
    lgpd: str
    id_processo: int
    id_atividade: str

    class Config:
        orm_mode = True

@app.get("/todos-metadados/", response_model=dict[str, List[MetadadosOut]])
async def get_metadados(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):  # Protegido
    """
    Retorna todos os metadados sem duplicação.
    """
    metadados = db.query(Metadados).all()
    return {
        "metadados": [
            {
                "id": meta.id,
                "nome": meta.nome,
                "dados": meta.dados,
                "lgpd": meta.lgpd,
                "id_processo": meta.id_processo,
                "id_atividade": meta.id_atividade
            } 
            for meta in metadados
        ]
    }

@app.post("/metadados/", response_model=MetadadosResponse)
def create_or_update_metadados(
    metadados: MetadadosCreate, 
    db: Session = Depends(get_db)
):
    """
    Cria ou atualiza os metadados de uma atividade específica de um processo.
    """
    try:
        # Check if metadata already exists
        existing_metadata = db.query(Metadados).filter(
            Metadados.id_processo == metadados.id_processo,
            Metadados.id_atividade == metadados.id_atividade,
            Metadados.nome == metadados.nome
        ).first()

        if existing_metadata:
            # Update existing metadata
            existing_metadata.lgpd = metadados.lgpd
            existing_metadata.dados = metadados.dados
            db_metadados_final = existing_metadata
        else:
            # Create new metadata
            db_metadados_novo = Metadados(**metadados.dict())
            db.add(db_metadados_novo)
            db_metadados_final = db_metadados_novo

        db.commit()
        db.refresh(db_metadados_final)
        
        return db_metadados_final

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar metadados: {str(e)}"
        )

# Add search endpoint
@app.get("/metadados/buscar/", response_model=dict[str, List[MetadadosOut]])
async def buscar_metadados(
    termo: str,
    db: Session = Depends(get_db)
):
    """
    Busca metadados por termo em dados ou LGPD.
    """
    metadados = db.query(Metadados).filter(
        (Metadados.dados.cast(String).ilike(f"%{termo}%")) |
        (Metadados.lgpd.ilike(f"%{termo}%"))
    ).all()
    
    return {
        "metadados": [
            {
                "id": meta.id,
                "nome": meta.nome,
                "dados": meta.dados,
                "lgpd": meta.lgpd,
                "id_processo": meta.id_processo,
                "id_atividade": meta.id_atividade
            }
            for meta in metadados
        ]
    }

# Endpoint para verificar status da autenticação
@app.get("/auth/status")
async def auth_status():
    return {
        "auth_enabled": AUTH_ENABLED,
        "message": "Autenticação ativa" if AUTH_ENABLED else "Autenticação desabilitada"
    }

# Endpoint para verificar usuário logado
@app.get("/auth/me")
async def get_me(current_user = Depends(get_current_active_user)):
    return {
        "user": {
            "id": current_user.id,
            "nome": current_user.nome,
            "email": current_user.email
        },
        "auth_enabled": AUTH_ENABLED
    }

# Logout (apenas limpa token no frontend)
@app.post("/auth/logout")
async def logout():
    return {"message": "Logout realizado com sucesso"}

# ...existing endpoints..