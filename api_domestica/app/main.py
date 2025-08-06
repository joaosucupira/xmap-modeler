

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import create_all_tables, drop_and_create_all_tables,get_db, Usuario, Item, Processo
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


origins = [
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints

# startup da aplicação
@app.on_event("startup")
def on_startup():
    create_all_tables()
    # drop_and_create_all_tables()

# Endpoints
@app.get("/")
async def read_root():
    return {"message": "API UHU!"}

@app.get("/usuarios/")
async def get_users_data(db: Session = Depends(get_db)):
    users = db.query(Usuario).all()
    return {"usuarios": [{"id": user.id, "nome": user.nome} for user in users]}

@app.get("/items/")
async def get_items_data(db: Session = Depends(get_db)):
    items = db.query(Item).all()
    return {"items": [{"id": item.id, "nome_item": item.nome_item} for item in items]}

@app.post("/usuarios/")
async def create_user(nome: str, db: Session = Depends(get_db)):

    if not nome.strip():
        raise HTTPException(status_code=400, detail="O nome não pode ser vazio ou conter apenas espaços.")

    user = Usuario(nome=nome.strip()) 
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Usuário criado com sucesso!", "usuario": {"id": user.id, "nome": user.nome}}

@app.post("/processos/")
async def create_processo(id_pai: int = None, id_area: int = None, titulo: str = None, db: Session = Depends(get_db)):
    proc = Processo(id_pai=id_pai, id_area=id_area, titulo=titulo)
    db.add(proc)
    db.commit()
    db.refresh(proc)
    return {"message": "Processo criado com sucesso!", "processo": {"id": proc.id, "id_pai": proc.id_pai, "id_area": proc.id_area, "titulo": proc.titulo, "data_publicacao": proc.data_publicacao}}

@app.get("/processos/")
async def get_processos(db: Session = Depends(get_db)):
    processos = db.query(Processo).all()
    return {"processos": [{"id": proc.id, "id_pai": proc.id_pai, "id_area": proc.id_area, "titulo": proc.titulo, "data_publicacao": proc.data_publicacao} for proc in processos]}