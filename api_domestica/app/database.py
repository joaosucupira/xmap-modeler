import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Date, JSON,Boolean, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_HOST = "db"
DB_PORT = "5432"
DB_NAME = "sucu_db"
DB_USER = "sucupira"
DB_PASSWORD = "12345"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)

Base = declarative_base()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

macro_processo_processo = Table(
    "macro_processo_processo",
    Base.metadata,
    Column("macro_processo_id", Integer, ForeignKey("macro_processos.id"), primary_key=True),
    Column("processo_id", Integer, ForeignKey("processos.id"), primary_key=True),
)


def create_all_tables(): 
    Base.metadata.create_all(bind=engine)

def drop_and_create_all_tables():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), index=True)
    email=Column(String(100),unique=True,index=True)
    senha_hash = Column(String)


class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_item = Column(String(100), index=True)


class Metadados(Base):
    __tablename__ = "metadados"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_processo = Column(Integer)
    id_atividade = Column(Integer)
    nome= Column(String(100), index=True)
    lgpd= Column(String(100), index=True)
    dados = Column(JSON)  # aqui vai guardar o json

class Processo(Base):
    __tablename__ = "processos" 
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_pai = Column(Integer, nullable=True)
    id_area = Column(Integer, nullable=True)
    ordem = Column(Integer, nullable=True)
    titulo = Column(String(200), nullable=False)
    conteudo = Column(Text, nullable=True)  # campo sem limite de caracteres, agora armazena o XML BPMN inteiro
    data_publicacao = Column(Date, default=datetime.date(2005, 10, 7))
    macro_processos = relationship(
        "MacroProcesso",
        secondary=macro_processo_processo,
        back_populates="processos"
    )


class MacroProcesso(Base):
    __tablename__ = "macro_processos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    processos = relationship(
        "Processo",
        secondary=macro_processo_processo,
        back_populates="macro_processos"
    )
    
class Area(Base):
    __tablename__ = 'areas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_area = Column(String)
    sigla = Column(String)
    tipo = Column(String)

class Documento(Base):
    __tablename__ = 'documentos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_proc = Column(Integer)
    nome_documento = Column(String)
    link = Column(String)

    

    

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()