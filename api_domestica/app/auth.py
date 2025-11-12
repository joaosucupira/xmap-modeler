import os
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db, Usuario

# Configurações
SECRET_KEY = os.getenv("SECRET_KEY", "sua-chave-secreta-super-forte-mude-em-producao")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

# Chave para ativar/desativar autenticação
AUTH_ENABLED = os.getenv("AUTH_ENABLED", "true").lower() in ("true", "1", "yes")

# Utilitários de senha com pre-hash para senhas longas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def _pre_hash_password(password: str) -> str:
    """
    Pre-hash da senha usando SHA256 para evitar limite de 72 bytes do bcrypt
    """
    if len(password.encode('utf-8')) > 72:
        # Se a senha for muito longa, fazer hash SHA256 primeiro
        return hashlib.sha256(password.encode('utf-8')).hexdigest()
    return password

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Verifica se a senha está correta"""
    try:
        # Pre-hash da senha se necessário
        senha_processada = _pre_hash_password(senha_plana)
        return pwd_context.verify(senha_processada, senha_hash)
    except ValueError as e:
        if "password cannot be longer than 72 bytes" in str(e):
            # Fallback: truncar a senha (não recomendado, mas funciona)
            senha_truncada = senha_plana.encode('utf-8')[:72].decode('utf-8', errors='ignore')
            return pwd_context.verify(senha_truncada, senha_hash)
        raise e
    except Exception as e:
        print(f"Erro na verificação de senha: {e}")
        return False

def gerar_hash_senha(senha: str) -> str:
    """Gera hash da senha"""
    try:
        # Pre-hash da senha se necessário
        senha_processada = _pre_hash_password(senha)
        return pwd_context.hash(senha_processada)
    except ValueError as e:
        if "password cannot be longer than 72 bytes" in str(e):
            # Fallback: truncar a senha
            senha_truncada = senha.encode('utf-8')[:72].decode('utf-8', errors='ignore')
            return pwd_context.hash(senha_truncada)
        raise e
    except Exception as e:
        print(f"Erro ao gerar hash da senha: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar senha")

def criar_token_acesso(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Valida token e retorna usuário autenticado"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_dummy_user(db: Session = Depends(get_db)):
    """Retorna usuário fictício quando auth está desabilitado"""
    # Tenta buscar um usuário admin existente
    admin_user = db.query(Usuario).filter(Usuario.email == "admin@xmap.com").first()
    if admin_user:
        return admin_user
    
    # Se não encontrar, cria um objeto de usuário temporário
    class DummyUser:
        def __init__(self):
            self.id = 1
            self.nome = "Usuário Padrão"
            self.email = "admin@xmap.com"
    
    return DummyUser()

# Dependência principal que alterna entre auth real e fictício
async def get_current_active_user(
    user = Depends(get_current_user if AUTH_ENABLED else get_dummy_user)
):
    """Retorna usuário logado (real ou fictício dependendo da configuração)"""
    return user