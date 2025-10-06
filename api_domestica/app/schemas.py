# schemas.py
from pydantic import BaseModel

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str

class UsuarioLogin(BaseModel):
    email: str
    senha: str

class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: str


from typing import List, Optional

class MetadadosBase(BaseModel):
    id_processo: int
    id_atividade: str
    nome: str = "generatedData" # Valor padrão para este caso de uso
    lgpd: str
    dados: List[str] # Espera uma lista de strings, exatamente como o generatedData

class MetadadosCreate(MetadadosBase):
    pass

class MetadadosResponse(MetadadosBase):
    id: int

    class Config:
        orm_mode = True # Permite que o Pydantic leia dados de objetos SQLAlchemy