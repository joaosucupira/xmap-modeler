# Updated database.py with new classes

import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Date, JSON, Boolean, DateTime, ForeignKey
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
    id_atividade = Column(String(100), index=True) ##mudanca de Integer para String
    nome= Column(String(100), index=True)
    lgpd= Column(String(100), index=True)
    dados = Column(JSON)  # aqui vai guardar o json

class Processo(Base):
    __tablename__ = "processos" 
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_pai = Column(Integer, ForeignKey('processos.id'), nullable=True)
    id_area = Column(Integer, nullable=True)
    ordem = Column(Integer, nullable=True)
    titulo = Column(String(200), nullable=False)
    data_publicacao = Column(Date, default=datetime.date(day=7, month=10, year=2005))
    data_criacao = Column(DateTime, default=datetime.datetime.utcnow)

class Mapa(Base):
    __tablename__ = 'mapas'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_proc = Column(Integer)
    titulo = Column(String(200), nullable=False)
    status = Column(String(50), default="Em andamento")  # Mudado para String com valores: "Concluído", "Em andamento", "Pendente"
    XML = Column(String)
    data_criacao = Column(DateTime, default=datetime.datetime.utcnow)
    data_modificacao = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    
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

# New classes for restructuring
class MacroProcesso(Base):
    __tablename__ = "macro_processos"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    titulo = Column(String(200), nullable=False)
    data_publicacao = Column(Date, default=datetime.date(day=7, month=10, year=2005))
    data_criacao = Column(DateTime, default=datetime.datetime.utcnow)

class MacroProcessoProcesso(Base):
    __tablename__ = "macro_processo_processo"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    macro_processo_id = Column(Integer, ForeignKey("macro_processos.id"), nullable=False)
    processo_id = Column(Integer, ForeignKey("processos.id"), nullable=False)
    ordem = Column(Integer, nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()