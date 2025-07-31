

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .database import create_all_tables, get_db, Usuario, Item
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
