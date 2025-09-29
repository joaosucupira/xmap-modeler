from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from .database import get_db, Mapa, validate_entity

router = APIRouter(prefix="/canvas")

@router.get("/view/{mapa_id}")
async def view_map_canvas(mapa_id: int, db: Session = Depends(get_db)):
    """
    Retorna o XML do mapa para visualização no canvas
    """
    # Buscar o mapa pelo ID
    mapa = validate_entity(db, mapa_id, Mapa)
    
    return Response(
        content=mapa.XML, 
        media_type="application/xml",
        headers={"Content-Disposition": "inline"}
    )

@router.get("/edit/{mapa_id}")
async def edit_map_canvas(mapa_id: int, db: Session = Depends(get_db)):
    """
    Retorna o XML do mapa para edição no canvas
    """
    # Buscar o mapa pelo ID
    mapa = validate_entity(db, mapa_id, Mapa)
    
    return Response(
        content=mapa.XML,
        media_type="application/xml", 
        headers={"Content-Disposition": "inline"}
    )

@router.put("/save/{mapa_id}")
async def save_map_canvas(
    mapa_id: int, 
    xml_content: str,
    db: Session = Depends(get_db)
):
    """
    Salva o XML editado no canvas
    """
    # Buscar o mapa pelo ID
    mapa = validate_entity(db, mapa_id, Mapa)
    
    # Atualizar o XML
    mapa.XML = xml_content
    db.commit()
    db.refresh(mapa)
    
    return {"message": "Mapa salvo com sucesso!", "mapa_id": mapa.id}