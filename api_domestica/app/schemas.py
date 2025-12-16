# schemas.py
from pydantic import BaseModel
from typing import Optional, List, Union

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

class MapCreate(BaseModel):
    id_proc: int
    titulo: str
    XML: Optional[str] = None
    status: Optional[str] = None

class MetadadosBase(BaseModel):
    id_processo: int
    id_atividade: str
    nome: str = "generatedData"
    lgpd: str
    dados: List[str]

class MetadadosCreate(MetadadosBase):
    pass

class MetadadosResponse(MetadadosBase):
    id: int

    class Config:
        from_attributes = True  # Atualizado de orm_mode para Pydantic v2

class MacroCreate(BaseModel):
    titulo: str
    data_publicacao: Union[str, None] = None

class ProcessoCreate(BaseModel):
    titulo: str
    id_pai: Optional[int] = None
    id_area: Optional[int] = None
    ordem: Optional[int] = None
    data_publicacao: Optional[str] = None

# REMOVIDO: Segunda definição duplicada de MapCreate