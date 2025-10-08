from fastapi import APIRouter, Depends, HTTPException, Response, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .database import get_db, Processo

router = APIRouter(prefix="/canvas")

class CreateProcesso(BaseModel):
    titulo: str
    xml_content: str
    id_pai: int = None
    id_area: int = None
    ordem: int = None

@router.get("/view/{processo_id}")
async def view_map_canvas(processo_id: int, db: Session = Depends(get_db)):
    """
    Retorna o XML do processo para visualização no canvas
    """
    processo = db.query(Processo).filter(Processo.id == processo_id).first()
    
    if not processo or not processo.conteudo:
        basic_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_{processo_id}" name="Processo {processo_id}">
    <bpmn:startEvent id="StartEvent_1" name="Início"/>
    <bpmn:endEvent id="EndEvent_1" name="Fim"/>
  </bpmn:process>
</bpmn:definitions>"""
        
        return Response(
            content=basic_xml,
            media_type="application/xml",
            headers={"Content-Disposition": "inline"}
        )
    
    return Response(
        content=processo.conteudo, 
        media_type="application/xml",
        headers={"Content-Disposition": "inline"}
    )

@router.get("/edit/{processo_id}")
async def edit_map_canvas(processo_id: int, db: Session = Depends(get_db)):
    """
    Retorna o XML do processo para edição no canvas
    """
    processo = db.query(Processo).filter(Processo.id == processo_id).first()
    
    if not processo or not processo.conteudo:
        basic_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_{processo_id}" name="Processo {processo_id}">
    <bpmn:startEvent id="StartEvent_1" name="Início"/>
    <bpmn:endEvent id="EndEvent_1" name="Fim"/>
  </bpmn:process>
</bpmn:definitions>"""
        
        return Response(
            content=basic_xml,
            media_type="application/xml",
            headers={"Content-Disposition": "inline"}
        )
    
    return Response(
        content=processo.conteudo,  # Corrigido: era 'processo.XML'
        media_type="application/xml", 
        headers={"Content-Disposition": "inline"}
    )

@router.put("/save/{processo_id}")
async def save_map_canvas(
    processo_id: int, 
    xml_content: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    Salva o XML editado no canvas diretamente no campo conteudo do Processo
    """
    processo = db.query(Processo).filter(Processo.id == processo_id).first()
    
    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    
    processo.conteudo = xml_content
    db.commit()
    db.refresh(processo)
    
    return {"message": "Processo salvo com sucesso!", "processo_id": processo.id}

@router.post("/create")
async def create_processo_canvas(
    processo_data: CreateProcesso,
    db: Session = Depends(get_db)
):
    """
    Cria um novo processo com o XML do BPMN no campo conteudo
    """
    novo_processo = Processo(
        id_pai=processo_data.id_pai,
        id_area=processo_data.id_area,
        ordem=processo_data.ordem,
        titulo=processo_data.titulo,
        conteudo=processo_data.xml_content  # Salva o XML inteiro aqui
    )
    db.add(novo_processo)
    db.commit()
    db.refresh(novo_processo)
    
    return {"message": "Processo criado com sucesso!", "processo_id": novo_processo.id}