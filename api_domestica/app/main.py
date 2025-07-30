from fastapi import FastAPI
from .database import fetch_users, fetch_items
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


origins = [
    'http://localhost:3000',
    'http://localhost'

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Endpoints

@app.get("/")
async def read_root():
    return {"message": "API ligada!"}

@app.get("/usuarios/")
async def get_users_data():
    users = fetch_users()
    return {"usuarios": users}

@app.get("/items/")
async def get_items_data():
    items = fetch_items()
    return {"items": items}

