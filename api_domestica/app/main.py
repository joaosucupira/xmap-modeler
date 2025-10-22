# api_domestica/app/main.py
# (Modified to add /hierarchy/ endpoint)

from fastapi import FastAPI, Depends, HTTPException,status
from sqlalchemy.orm import Session

from .database import Metadados, create_all_tables, drop_and_create_all_tables,get_db, Usuario, Item, Processo, Mapa, Area, Documento, MacroProcesso, MacroProcessoProcesso
from fastapi.middleware.cors import CORSMiddleware
from .utils import validate_entity
from fastapi.responses import Response
from .schemas import UsuarioCreate,UsuarioLogin,UsuarioOut,MetadadosBase,MetadadosCreate,MetadadosResponse
from fastapi.staticfiles import StaticFiles  # Importar StaticFiles

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
   pass
   #create_all_tables()
   #drop_and_create_all_tables() # CUIDADO! Isto irá apagar todos os dados existentes e criar as tabelas novamente.


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

@app.post("/register", response_model=UsuarioOut)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Email já registrado")
    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=gerar_hash_senha(usuario.senha)
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@app.post("/login")
def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if not db_usuario or not verificar_senha(usuario.senha, db_usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = criar_token_acesso(data={"sub": db_usuario.email})
    return {"access_token": token, "token_type": "bearer"}


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
async def create_mapa(id_proc: int, titulo: str, XML: str, db: Session = Depends(get_db)):
    mapa = Mapa(id_proc=id_proc, titulo=titulo, XML=XML)
    db.add(mapa)
    db.commit()
    db.refresh(mapa)
    return {"message": "Mapa criado com sucesso!", "mapa": {"id": mapa.id, "id_proc": mapa.id_proc, "titulo": mapa.titulo, "XML": mapa.XML}}

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

# Em seu arquivo main.py
# Em seu arquivo main.py

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
async def create_association(macro_processo_id: int, processo_id: int, ordem: int = None, db: Session = Depends(get_db)):
    # Validate entities exist
    validate_entity(db, macro_processo_id, MacroProcesso)
    proc = validate_entity(db, processo_id, Processo)
    if proc.id_pai is not None:
        raise HTTPException(status_code=400, detail="Apenas processos de nível superior (sem pai) podem ser associados a macroprocessos.")
    assoc = MacroProcessoProcesso(macro_processo_id=macro_processo_id, processo_id=processo_id, ordem=ordem)
    db.add(assoc)
    db.commit()
    db.refresh(assoc)
    return {"message": "Associação criada com sucesso!", "associacao": {"id": assoc.id, "macro_processo_id": assoc.macro_processo_id, "processo_id": assoc.processo_id, "ordem": assoc.ordem}}

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
    mapa = db.query(Mapa).filter(Mapa.id_proc == proc.id).first()
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
    if mapa:
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