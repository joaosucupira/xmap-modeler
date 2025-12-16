from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from .database import get_db, Processo, Mapa

router = APIRouter()

@router.get("/")
async def get_dashboard_data(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """
    Fornece dados agregados para o dashboard (endpoint público).
    Pode ser filtrado por status (ex: /dashboard?status=Concluído).
    """
    # Query base que une Processo e Mapa
    query = db.query(Processo, Mapa).join(Mapa, Processo.id == Mapa.id_proc)

    # Aplica o filtro de status no campo da tabela Mapa
    if status_filter and status_filter != "todos":
        query = query.filter(Mapa.status == status_filter)

    # 1. Contagem total de processos (respeitando o filtro)
    total_processos = query.count()

    # 2. Contagem de processos por status (sempre global, buscando de Mapa)
    status_counts_query = db.query(Mapa.status, func.count(Processo.id))\
                            .join(Processo, Mapa.id_proc == Processo.id)\
                            .group_by(Mapa.status).all()
    status_counts = {status or "Sem status": count for status, count in status_counts_query}

    # 3. Processos modificados recentemente (usando data_modificacao do Mapa)
    processos_recentes_tuplas = query.order_by(Mapa.data_modificacao.desc()).limit(10).all()

    # Monta a lista de processos recentes a partir das tuplas
    processos_recentes = []
    for processo, mapa in processos_recentes_tuplas:
        processos_recentes.append({
            "id": processo.id,
            "titulo": processo.titulo,
            "status": mapa.status or "Sem status",
            "dataModificacao": mapa.data_modificacao.isoformat() if mapa.data_modificacao else None
        })

    return {
        "stats": {
            "totalProcessos": total_processos,
            "statusCounts": status_counts,
        },
        "processosRecentes": processos_recentes
    }