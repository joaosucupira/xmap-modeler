import os
from sqlalchemy import create_engine, Column, Integer, String
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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()