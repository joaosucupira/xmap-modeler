from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List, Dict, Any

# Importa a função para obter a sessão do banco e todos os modelos de dados
from .database import get_db, Usuario, Processo, Metadados, Area, Documento, Item

# Cria um APIRouter. É uma boa prática para organizar os endpoints em módulos.
# Você pode incluir este router no seu app principal no arquivo main.py.
router = APIRouter(
    prefix="/banco",
    tags=["Busca Geral no Banco de Dados"]
)

# Mapeamento de nomes de tabelas (usados no filtro) para os modelos SQLAlchemy
# e as colunas onde a busca será realizada.
MAPEAMENTO_BUSCA = {
    "usuarios": {
        "modelo": Usuario,
        "colunas": [Usuario.nome, Usuario.email],
        "resultado": lambda u: f"{u.nome} ({u.email})" # Função para formatar a descrição do resultado
    },
    "processos": {
        "modelo": Processo,
        "colunas": [Processo.titulo],
        "resultado": lambda p: p.titulo
    },
    "metadados": {
        "modelo": Metadados,
        "colunas": [Metadados.nome, Metadados.lgpd],
        "resultado": lambda m: f"{m.nome} (LGPD: {m.lgpd})"
    },
    "areas": {
        "modelo": Area,
        "colunas": [Area.nome_area, Area.sigla],
        "resultado": lambda a: f"{a.nome_area} ({a.sigla})"
    },
    "documentos": {
        "modelo": Documento,
        "colunas": [Documento.nome_documento],
        "resultado": lambda d: d.nome_documento
    },
    "items": {
        "modelo": Item,
        "colunas": [Item.nome_item],
        "resultado": lambda i: i.nome_item
    }
}

@router.get("/busca-geral/", summary="Realiza uma busca textual em todo o banco de dados")
async def busca_geral(
    q: str = Query(..., min_length=3, description="Termo de busca. Mínimo de 3 caracteres."),
    tabelas: Optional[List[str]] = Query(None, description=f"Filtro opcional para buscar apenas em tabelas específicas. Opções: {list(MAPEAMENTO_BUSCA.keys())}"),
    db: Session = Depends(get_db)
):
    """
    Este endpoint realiza uma busca textual case-insensitive em diversas tabelas do banco.

    - **q**: O termo que você deseja procurar.
    - **tabelas**: Uma lista opcional para restringir a busca a certas entidades.
      Exemplo de uso: `/banco/busca-geral/?q=relatorio&tabelas=processos&tabelas=documentos`
    """
    resultados_finais = []
    
    # Define em quais tabelas procurar: as especificadas no filtro ou todas.
    tabelas_a_buscar = tabelas if tabelas else MAPEAMENTO_BUSCA.keys()

    for nome_tabela in tabelas_a_buscar:
        if nome_tabela not in MAPEAMENTO_BUSCA:
            # Ignora nomes de tabelas inválidos no filtro para não quebrar a busca
            continue

        config = MAPEAMENTO_BUSCA[nome_tabela]
        modelo = config["modelo"]
        colunas_busca = config["colunas"]
        formatar_resultado = config["resultado"]

        # Constrói a consulta com `ilike` para busca case-insensitive e `or_` para múltiplas colunas
        filtros = [coluna.ilike(f"%{q}%") for coluna in colunas_busca]
        query_results = db.query(modelo).filter(or_(*filtros)).all()

        # Formata os resultados encontrados em um formato padronizado
        for item in query_results:
            resultados_finais.append({
                "tabela": nome_tabela,
                "id": item.id,
                "descricao": formatar_resultado(item),
                # Você pode adicionar um link para a rota GET específica da entidade aqui se desejar
                "link_api": f"/{nome_tabela}/{item.id}" 
            })

    if not resultados_finais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum resultado encontrado para o termo de busca."
        )

    return {"resultados": resultados_finais}