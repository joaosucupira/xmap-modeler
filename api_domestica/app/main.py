# api_domestica/app/main.py
# (Modified to add /hierarchy/ endpoint)

from datetime import datetime
from sqlalchemy import String
from fastapi import FastAPI, Depends, HTTPException,status
from sqlalchemy.orm import Session

from .database import Metadados, create_all_tables, drop_and_create_all_tables,get_db, Usuario, Item, Processo, Mapa, Area, Documento, MacroProcesso, MacroProcessoProcesso
from fastapi.middleware.cors import CORSMiddleware
from .utils import validate_entity
from fastapi.responses import Response
from .schemas import UsuarioCreate,UsuarioLogin,UsuarioOut,MetadadosBase,MetadadosCreate,MetadadosResponse
from fastapi.staticfiles import StaticFiles  # Importar StaticFiles
from .auth import AUTH_ENABLED, get_current_active_user

from .auth import gerar_hash_senha, verificar_senha, criar_token_acesso
from .schemas import MacroCreate
from pydantic import BaseModel
from typing import List
from . import xbanco, dashboard
from . import gemini
from . import canvas

from pydantic import BaseModel
from typing import Optional

class MacroProcessoProcessoCreate(BaseModel):
    macro_processo_id: int
    processo_id: int
    ordem: Optional[int] = None

app = FastAPI()


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4500",
    "http://127.0.0.1:4500",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",    # Vite default port
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
    
   #create_all_tables()
   drop_and_create_all_tables() # CUIDADO! Isto irá apagar todos os dados existentes e criar as tabelas novamente.


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
from .schemas import ProcessoCreate  # Add import

@app.post("/processos/")
async def create_processo(proc: ProcessoCreate, db: Session = Depends(get_db)):
    new_proc = Processo(**proc.dict())
    db.add(new_proc)
    db.commit()
    db.refresh(new_proc)
    return {"message": "Processo criado com sucesso!", "processo": {"id": new_proc.id, "id_pai": new_proc.id_pai, "id_area": new_proc.id_area, "ordem": new_proc.ordem, "titulo": new_proc.titulo, "data_publicacao": new_proc.data_publicacao}}

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
    proc = validate_entity(db, processo_id, Processo)
    
    # 1. Deletar associações com macroprocessos
    db.query(MacroProcessoProcesso).filter(
        MacroProcessoProcesso.processo_id == processo_id
    ).delete()
    
    # 2. Deletar mapas associados ao processo
    db.query(Mapa).filter(Mapa.id_proc == processo_id).delete()
    
    # 3. Deletar metadados associados aos mapas do processo
    # (Os metadados usam id_processo como id do mapa, então precisamos buscar os mapas primeiro)
    mapas_ids = [m.id for m in db.query(Mapa.id).filter(Mapa.id_proc == processo_id).all()]
    if mapas_ids:
        db.query(Metadados).filter(Metadados.id_processo.in_(mapas_ids)).delete(synchronize_session=False)
    
    # 4. Atualizar processos filhos (remover referência ao pai) ou deletá-los
    # Opção A: Remover referência ao pai (os filhos ficam órfãos)
    # db.query(Processo).filter(Processo.id_pai == processo_id).update({"id_pai": None})
    
    # Opção B: Deletar filhos recursivamente
    def delete_children(parent_id):
        children = db.query(Processo).filter(Processo.id_pai == parent_id).all()
        for child in children:
            delete_children(child.id)  # Recursivo
            # Deletar mapas do filho
            db.query(Mapa).filter(Mapa.id_proc == child.id).delete()
            db.delete(child)
    
    delete_children(processo_id)
    
    # 5. Finalmente, deletar o processo
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
# main.py update create_mapa

from .schemas import MapCreate  # Add this import

@app.post("/mapas/")
async def create_mapa(mapa: MapCreate, db: Session = Depends(get_db)):
    new_mapa = Mapa(
        id_proc=mapa.id_proc,
        titulo=mapa.titulo,
        XML=mapa.XML or '<bpmn:definitions id="Definitions_1"><bpmn:process id="Process_1"></bpmn:process></bpmn:definitions>',
        status=mapa.status or "Em andamento"
    )

    db.add(new_mapa)
    db.commit()
    db.refresh(new_mapa)

    return {
        "message": "Mapa criado com sucesso!",
        "mapa": {
            "id": new_mapa.id,
            "id_proc": new_mapa.id_proc,
            "titulo": new_mapa.titulo,
            "XML": new_mapa.XML,
            "status": new_mapa.status,
            "data_criacao": new_mapa.data_criacao,
            "data_modificacao": new_mapa.data_modificacao
        }
    }

# Adicionar endpoint PUT para atualizar mapa
@app.put("/mapas/{mapa_id}")
async def update_mapa(
    mapa_id: int, 
    titulo: str = None,
    status: str = None,
    XML: str = None,
    db: Session = Depends(get_db)
):
    mapa = validate_entity(db, mapa_id, Mapa)
    
    if titulo is not None:
        mapa.titulo = titulo
    if status is not None:
        mapa.status = status
    if XML is not None:
        mapa.XML = XML
    
    # Atualiza data_modificacao manualmente (caso onupdate não funcione)
    mapa.data_modificacao = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(mapa)
    
    return {
        "message": "Mapa atualizado com sucesso!",
        "mapa": {
            "id": mapa.id,
            "id_proc": mapa.id_proc,
            "titulo": mapa.titulo,
            "status": mapa.status,
            "data_modificacao": mapa.data_modificacao
        }
    }
@app.patch("/mapas/{mapa_id}/status")
async def update_mapa_status(
    mapa_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    mapa = validate_entity(db, mapa_id, Mapa)
    
    valid_statuses = ["Concluído", "Em andamento", "Pendente"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Status inválido. Use um dos seguintes: {', '.join(valid_statuses)}"
        )
    
    mapa.status = status
    mapa.data_modificacao = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(mapa)
    
    return {
        "message": "Status atualizado com sucesso!",
        "mapa": {
            "id": mapa.id,
            "titulo": mapa.titulo,
            "status": mapa.status,
            "data_modificacao": mapa.data_modificacao
        }
    }

# ...existing code...

# ============== MOVE ENDPOINTS ==============

class MoveProcessoRequest(BaseModel):
    """Mover processo para outro macroprocesso ou como subprocesso de outro processo"""
    target_macro_id: Optional[int] = None  # Se mover para macroprocesso
    target_processo_id: Optional[int] = None  # Se mover como subprocesso
    ordem: Optional[int] = None

class MoveMapaRequest(BaseModel):
    """Mover mapa para outro processo"""
    target_processo_id: int
    
@app.put("/processos/{processo_id}/move")
async def move_processo(
    processo_id: int, 
    data: MoveProcessoRequest,
    db: Session = Depends(get_db)
):
    """Move um processo para outro macroprocesso ou como subprocesso de outro processo"""
    processo = validate_entity(db, processo_id, Processo)
    
    # Validar que pelo menos um destino foi fornecido
    if data.target_macro_id is None and data.target_processo_id is None:
        raise HTTPException(
            status_code=400, 
            detail="Deve fornecer target_macro_id ou target_processo_id"
        )
    
    # Não pode mover para os dois ao mesmo tempo
    if data.target_macro_id is not None and data.target_processo_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Não pode mover para macroprocesso e processo ao mesmo tempo"
        )
    
    # Se movendo para um macroprocesso
    if data.target_macro_id is not None:
        validate_entity(db, data.target_macro_id, MacroProcesso)
        
        # Remover associação antiga com qualquer macroprocesso
        db.query(MacroProcessoProcesso).filter(
            MacroProcessoProcesso.processo_id == processo_id
        ).delete()
        
        # Remover id_pai se tiver (não é mais subprocesso)
        processo.id_pai = None
        
        # Criar nova associação
        new_assoc = MacroProcessoProcesso(
            macro_processo_id=data.target_macro_id,
            processo_id=processo_id,
            ordem=data.ordem
        )
        db.add(new_assoc)
        
    # Se movendo como subprocesso de outro processo
    elif data.target_processo_id is not None:
        target_processo = validate_entity(db, data.target_processo_id, Processo)
        
        # Não pode mover para si mesmo
        if target_processo.id == processo_id:
            raise HTTPException(
                status_code=400,
                detail="Não pode mover um processo para si mesmo"
            )
        
        # Verificar se não está criando ciclo (o target não pode ser filho do processo)
        def is_descendant(parent_id: int, check_id: int) -> bool:
            children = db.query(Processo).filter(Processo.id_pai == parent_id).all()
            for child in children:
                if child.id == check_id:
                    return True
                if is_descendant(child.id, check_id):
                    return True
            return False
        
        if is_descendant(processo_id, data.target_processo_id):
            raise HTTPException(
                status_code=400,
                detail="Não pode mover um processo para um de seus descendentes"
            )
        
        # Remover associação com macroprocesso se existir
        db.query(MacroProcessoProcesso).filter(
            MacroProcessoProcesso.processo_id == processo_id
        ).delete()
        
        # Definir novo pai
        processo.id_pai = data.target_processo_id
        processo.ordem = data.ordem
    
    db.commit()
    db.refresh(processo)
    
    return {
        "message": "Processo movido com sucesso!",
        "processo": {
            "id": processo.id,
            "id_pai": processo.id_pai,
            "titulo": processo.titulo
        }
    }


@app.put("/mapas/{mapa_id}/move")
async def move_mapa(
    mapa_id: int,
    data: MoveMapaRequest,
    db: Session = Depends(get_db)
):
    """Move um mapa para outro processo"""
    mapa = validate_entity(db, mapa_id, Mapa)
    validate_entity(db, data.target_processo_id, Processo)
    
    mapa.id_proc = data.target_processo_id
    
    db.commit()
    db.refresh(mapa)
    
    return {
        "message": "Mapa movido com sucesso!",
        "mapa": {
            "id": mapa.id,
            "id_proc": mapa.id_proc,
            "titulo": mapa.titulo
        }
    }

# ...existing code...
@app.get("/mapas/")
async def get_mapas(db: Session = Depends(get_db)):
    mapas = db.query(Mapa).all()
    return {"mapas": [{
        "id": mapa.id, 
        "id_proc": mapa.id_proc, 
        "XML": mapa.XML, 
        "titulo": mapa.titulo,
        "status": mapa.status,
        "data_criacao": mapa.data_criacao.isoformat() if mapa.data_criacao else None,
        "data_modificacao": mapa.data_modificacao.isoformat() if mapa.data_modificacao else None
    } for mapa in mapas]}

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

@app.get("/mapas/xml/{mapa_id}") # Nova rota para retornar apenas o XML
async def get_mapa_xml(mapa_id: int, db: Session = Depends(get_db)):

    mapa = validate_entity(db, mapa_id, Mapa)
    
    # Retorna o conteúdo do campo XML com o tipo de mídia correto
    return Response(content=mapa.XML, media_type="application/xml")

# Documentos e Areas

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
async def get_metadados(db: Session = Depends(get_db)):
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
# Adicione após o endpoint @app.get("/mapas/xml/{mapa_id}")

@app.delete("/mapas/{mapa_id}")
async def delete_mapa(mapa_id: int, db: Session = Depends(get_db)):
    mapa = validate_entity(db, mapa_id, Mapa)
    
    # Opcional: deletar metadados associados ao mapa
    db.query(Metadados).filter(Metadados.id_processo == mapa_id).delete()
    
    db.delete(mapa)
    db.commit()
    return {"message": "Mapa deletado com sucesso!"}


@app.get("/metadados/buscar/")
async def buscar_metadados(
    termo: str,
    db: Session = Depends(get_db)
):
    """
    Busca metadados por termo em dados, LGPD ou nome.
    Retorna também o nome do mapa e do processo associado.
    """
    metadados = db.query(Metadados).filter(
        (Metadados.dados.cast(String).ilike(f"%{termo}%")) |
        (Metadados.lgpd.ilike(f"%{termo}%")) |
        (Metadados.nome.ilike(f"%{termo}%"))
    ).all()
    
    result = []
    for meta in metadados:
        # Buscar o mapa associado
        mapa = db.query(Mapa).filter(Mapa.id == meta.id_processo).first()
        
        # Buscar o processo associado ao mapa
        processo_nome = None
        mapa_titulo = None
        if mapa:
            mapa_titulo = mapa.titulo
            processo = db.query(Processo).filter(Processo.id == mapa.id_proc).first()
            if processo:
                processo_nome = processo.titulo
        
        result.append({
            "id": meta.id,
            "nome": meta.nome,
            "dados": meta.dados,
            "lgpd": meta.lgpd,
            "id_processo": meta.id_processo,  # ID do Mapa
            "id_atividade": meta.id_atividade,
            "mapa_titulo": mapa_titulo,
            "processo_nome": processo_nome
        })
    
    return {"metadados": result}

@app.post("/metadados/", response_model=MetadadosResponse)
def create_or_update_metadados(
    metadados: MetadadosCreate, 
    db: Session = Depends(get_db)
):
    """
    Cria ou atualiza os metadados de uma atividade específica de um processo.
    Versão com logs detalhados para depuração.
    """
    print("\n--- INICIANDO REQUISIÇÃO PARA /metadados/ ---")
    print(f"Recebido: id_processo={metadados.id_processo}, id_atividade='{metadados.id_atividade}', nome='{metadados.nome}'")

    # Tenta encontrar o objeto existente com base na chave única
    try:
        existing_metadata = db.query(Metadados).filter(
            Metadados.id_processo == metadados.id_processo,
            Metadados.id_atividade == metadados.id_atividade,
            Metadados.nome == metadados.nome
        ).one_or_none() # Usar one_or_none() é mais explícito que .first()

        if existing_metadata:
            # Se encontrou, entra no modo de ATUALIZAÇÃO
            print(f"--> ENCONTRADO registro existente com ID: {existing_metadata.id}. ATUALIZANDO.")
            existing_metadata.lgpd = metadados.lgpd
            existing_metadata.dados = metadados.dados
            db_metadados_final = existing_metadata
            
        else:
            # Se NÃO encontrou, entra no modo de CRIAÇÃO
            print("--> NÃO ENCONTRADO registro existente. CRIANDO NOVO.")
            db_metadados_novo = Metadados(**metadados.dict())
            db.add(db_metadados_novo)
            db_metadados_final = db_metadados_novo

        # Salva as alterações (seja criação ou atualização)
        db.commit()
        # Refresh para obter o estado final do objeto do banco de dados
        db.refresh(db_metadados_final)
        
        print(f"Operação concluída. ID final do registro: {db_metadados_final.id}")
        print("--- FIM DA REQUISIÇÃO ---\n")
        
        return db_metadados_final

    except Exception as e:
        print(f"!!!!!! OCORREU UM ERRO INESPERADO: {e} !!!!!!")
        db.rollback() # Desfaz a transação em caso de erro
        raise HTTPException(status_code=500, detail=str(e))



    @app.put("/metadados/{metadado_id}")
    async def update_metadados(metadado_id: int, nome: str = None, lgpd: str = None, dados: dict = None, db: Session = Depends(get_db)):
        metadado = db.query(Metadados).filter(Metadados.id == metadado_id).first()
        
        if not metadado:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadado não encontrado.")
        
        updated = False
        if nome is not None:
            metadado.nome = nome
            updated = True
        if lgpd is not None:
            metadado.lgpd = lgpd
            updated = True
        if dados is not None:
            metadado.dados = dados
            updated = True

        if updated:
            db.commit()
            db.refresh(metadado)

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
    

@app.put("/metadados/{metadado_id}")
async def update_metadados(metadado_id: int, nome: str = None, lgpd: str = None, dados: dict = None, db: Session = Depends(get_db)):
    metadado = db.query(Metadados).filter(Metadados.id == metadado_id).first()
    
    if not metadado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metadado não encontrado.")
    
    updated = False
    if nome is not None:
        metadado.nome = nome
        updated = True
    if lgpd is not None:
        metadado.lgpd = lgpd
        updated = True
    if dados is not None:
        metadado.dados = dados
        updated = True

    if updated:
        db.commit()
        db.refresh(metadado)

    return {
        "message": "Metadado atualizado com sucesso!",
        "metadado": {
            "id": metadado.id,
            "id_processo": metadado.id_processo,
            "id_atividade": metadado.id_atividade,
            "nome": metadado.nome,
            "lgpd": metadado.lgpd,
            "dados": metadado.dados
        }
    }

@app.get("/todos-metadados/")
async def get_metadados( db: Session = Depends(get_db)):
    metadados = db.query(Metadados).all()

    return {"metadados": [metadados for meta in metadados]}

# New endpoints for MacroProcesso
#@app.post("/macroprocessos/")
#async def create_macroprocesso(titulo: str, data_publicacao: str = None, db: Session = Depends(get_db)):
#    if not titulo.strip():
#        raise HTTPException(status_code=400, detail="O título não pode ser vazio.")
#    macro = MacroProcesso(titulo=titulo.strip(), data_publicacao=data_publicacao)
#    db.add(macro)
#    db.commit()
#    db.refresh(macro)
#    return {"message": "MacroProcesso criado com sucesso!", "macroprocesso": {"id": macro.id, "titulo": macro.titulo, "data_publicacao": macro.data_publicacao}}

@app.get("/macroprocessos/")
async def get_macroprocessos(db: Session = Depends(get_db)):
    macros = db.query(MacroProcesso).all()
    return {"macroprocessos": [{"id": m.id, "titulo": m.titulo, "data_publicacao": m.data_publicacao, "data_criacao": m.data_criacao} for m in macros]}

@app.get("/macroprocessos/{macro_id}")
async def get_macroprocesso(macro_id: int, db: Session = Depends(get_db)):
    macro = validate_entity(db, macro_id, MacroProcesso)
    return {"macroprocesso": {"id": macro.id, "titulo": macro.titulo, "data_publicacao": macro.data_publicacao}}


@app.delete("/macroprocessos/{macro_id}")
async def delete_macroprocesso(macro_id: int, db: Session = Depends(get_db)):
    macro = validate_entity(db, macro_id, MacroProcesso)
    
    # Deletar associações com processos primeiro
    db.query(MacroProcessoProcesso).filter(
        MacroProcessoProcesso.macro_processo_id == macro_id
    ).delete()
    
    db.delete(macro)
    db.commit()
    return {"message": "MacroProcesso deletado com sucesso!"}


@app.put("/macroprocessos/{macro_id}")
async def update_macroprocesso(macro_id: int, titulo: str = None, data_publicacao: str = None, db: Session = Depends(get_db)):
    macro = validate_entity(db, macro_id, MacroProcesso)
    if titulo is not None:
        macro.titulo = titulo
    if data_publicacao is not None:
        macro.data_publicacao = data_publicacao
    db.commit()
    db.refresh(macro)
    return {"message": "MacroProcesso atualizado com sucesso!", "macroprocesso": {"id": macro.id, "titulo": macro.titulo, "data_publicacao": macro.data_publicacao}}

# Endpoints for associations (MacroProcessoProcesso)
@app.post("/macroprocesso_processos/")
async def create_association(
    data: MacroProcessoProcessoCreate,
    db: Session = Depends(get_db)
):
    validate_entity(db, data.macro_processo_id, MacroProcesso)
    proc = validate_entity(db, data.processo_id, Processo)

    if proc.id_pai is not None:
        raise HTTPException(
            status_code=400,
            detail="Apenas processos de nível superior (sem pai) podem ser associados a macroprocessos."
        )

    assoc = MacroProcessoProcesso(
        macro_processo_id=data.macro_processo_id,
        processo_id=data.processo_id,
        ordem=data.ordem
    )

    db.add(assoc)
    db.commit()
    db.refresh(assoc)

    return {
        "message": "Associação criada com sucesso!",
        "associacao": {
            "id": assoc.id,
            "macro_processo_id": assoc.macro_processo_id,
            "processo_id": assoc.processo_id,
            "ordem": assoc.ordem
        }
    }


@app.get("/macroprocessos/{macro_id}/processos/")
async def get_macro_processos(macro_id: int, db: Session = Depends(get_db)):
    validate_entity(db, macro_id, MacroProcesso)
    assocs = db.query(MacroProcessoProcesso).filter(MacroProcessoProcesso.macro_processo_id == macro_id).all()
    if not assocs:
        return {"processos": []}
    processo_ids = [a.processo_id for a in assocs]
    processos = db.query(Processo).filter(Processo.id.in_(processo_ids)).all()
    assoc_map = {a.processo_id: a.ordem for a in assocs}
    processos_sorted = sorted(processos, key=lambda p: assoc_map.get(p.id, 0))
    return {"processos": [{"id": p.id, "id_pai": p.id_pai, "id_area": p.id_area, "ordem": p.ordem, "titulo": p.titulo, "data_publicacao": p.data_publicacao, "data_criacao": p.data_criacao} for p in processos_sorted]}


@app.get("/macroprocesso_processos/")
async def get_associations(db: Session = Depends(get_db)):
    assocs = db.query(MacroProcessoProcesso).all()
    return {"associacoes": [{"id": a.id, "macro_processo_id": a.macro_processo_id, "processo_id": a.processo_id, "ordem": a.ordem} for a in assocs]}

# Add endpoint to get mapa for a specific processo
@app.get("/processos/{processo_id}/mapa")
async def get_processo_mapa(processo_id: int, db: Session = Depends(get_db)):
    mapa = db.query(Mapa).filter(Mapa.id_proc == processo_id).first()
    if not mapa:
        return {"mapa": None}
    return {"mapa": {"id": mapa.id, "id_proc": mapa.id_proc, "XML": mapa.XML, "titulo": mapa.titulo}}

# New endpoint for full hierarchy
@app.get("/hierarchy/")
async def get_hierarchy(db: Session = Depends(get_db)):
    macros = db.query(MacroProcesso).all()
    result = []
    for macro in macros:
        macro_dict = {
            "id": macro.id,
            "titulo": macro.titulo,
            "type": "macro",
            "children": []
        }
        assocs = db.query(MacroProcessoProcesso).filter(
            MacroProcessoProcesso.macro_processo_id == macro.id
        ).order_by(MacroProcessoProcesso.ordem).all()
        for assoc in assocs:
            proc = db.query(Processo).filter(Processo.id == assoc.processo_id).first()
            if proc:
                proc_node = build_proc_dict(proc, db)
                macro_dict["children"].append(proc_node)
        result.append(macro_dict)
    return {"hierarchy": result}

def build_proc_dict(proc: Processo, db: Session):
    children = db.query(Processo).filter(
        Processo.id_pai == proc.id
    ).order_by(Processo.ordem).all()
    mapas = db.query(Mapa).filter(Mapa.id_proc == proc.id).all()
    proc_dict = {
        "id": proc.id,
        "titulo": proc.titulo,
        "type": "process",
        "data_criacao": proc.data_criacao.isoformat() if proc.data_criacao else None,
        "children": []
    }
    for child in children:
        child_dict = build_proc_dict(child, db)
        proc_dict["children"].append(child_dict)
    for mapa in mapas:
        map_node = {
            "id": mapa.id,
            "titulo": mapa.titulo,
            "type": "map",
            "proc_id": proc.id,
            "data_criacao": proc.data_criacao.isoformat() if proc.data_criacao else None,
        }
        proc_dict["children"].append(map_node)
    return proc_dict

from .schemas import MacroCreate
@app.post("/macroprocessos/")
async def create_macroprocesso(macro: MacroCreate, db: Session = Depends(get_db)):
    if not macro.titulo.strip():
        raise HTTPException(status_code=400, detail="O título não pode ser vazio.")
    new_macro = MacroProcesso(titulo=macro.titulo.strip(), data_publicacao=macro.data_publicacao)
    db.add(new_macro)
    db.commit()
    db.refresh(new_macro)
    return {"message": "MacroProcesso criado com sucesso!", "macroprocesso": {"id": new_macro.id, "titulo": new_macro.titulo, "data_publicacao": new_macro.data_publicacao}}
    