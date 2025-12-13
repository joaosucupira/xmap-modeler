from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File
from sqlalchemy.orm import Session
from .database import get_db, Mapa
import shutil
import os
import uuid
router = APIRouter(prefix="/canvas")

@router.get("/view/{mapa_id}")
async def view_map_canvas(mapa_id: int, db: Session = Depends(get_db)):
    """
    Retorna o XML do mapa para visualização no canvas
    """
    # Buscar o mapa pelo ID diretamente
    mapa = db.query(Mapa).filter(Mapa.id == mapa_id).first()
    
    if not mapa:
        # Se não existir, retornar XML básico
        basic_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1gghy4b" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.9.0">
  <bpmn:collaboration id="Collaboration_0te0omg">
    <bpmn:participant id="Participant_0snu5vh" processRef="Process_0sm7z4l" />
  </bpmn:collaboration>
  <bpmn:process id="Process_0sm7z4l" isExecutable="false">
    <bpmn:startEvent id="StartEvent_129t7pc" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_0te0omg">
      <bpmndi:BPMNShape id="Participant_0snu5vh_di" bpmnElement="Participant_0snu5vh" isHorizontal="true">
        <dc:Bounds x="160" y="40" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_129t7pc">
        <dc:Bounds x="266" y="112" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
"""
        
        return Response(
            content=basic_xml,
            media_type="application/xml",
            headers={"Content-Disposition": "inline"}
        )
    
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
    # Buscar o mapa pelo ID diretamente
    mapa = db.query(Mapa).filter(Mapa.id == mapa_id).first()
    
    if not mapa:
        # Se não existir, retornar XML básico
        basic_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1gghy4b" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.9.0">
  <bpmn:collaboration id="Collaboration_0te0omg">
    <bpmn:participant id="Participant_0snu5vh" processRef="Process_0sm7z4l" />
  </bpmn:collaboration>
  <bpmn:process id="Process_0sm7z4l" isExecutable="false">
    <bpmn:startEvent id="StartEvent_129t7pc" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_0te0omg">
      <bpmndi:BPMNShape id="Participant_0snu5vh_di" bpmnElement="Participant_0snu5vh" isHorizontal="true">
        <dc:Bounds x="160" y="40" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_129t7pc">
        <dc:Bounds x="266" y="112" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
"""
        
        return Response(
            content=basic_xml,
            media_type="application/xml",
            headers={"Content-Disposition": "inline"}
        )
    
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
    # Buscar o mapa pelo ID diretamente
    mapa = db.query(Mapa).filter(Mapa.id == mapa_id).first()
    
    if not mapa:
        # Se não existir, criar um novo
        from .database import Processo
        processo = db.query(Processo).filter(Processo.id == 1).first()
        if not processo:
            processo = Processo(titulo=f"Processo {mapa_id}")
            db.add(processo)
            db.commit()
            db.refresh(processo)
        
        # Criar novo mapa
        mapa = Mapa(id_proc=processo.id, XML=xml_content)
        db.add(mapa)
        db.commit()
        db.refresh(mapa)
        
        return {"message": "Mapa criado com sucesso!", "mapa_id": mapa.id}
    
    # Atualizar o XML
    mapa.XML = xml_content
    db.commit()
    db.refresh(mapa)
    
    return {"message": "Mapa salvo com sucesso!", "mapa_id": mapa.id}

# Diretório para salvar os uploads
UPLOAD_DIR = "uploads"

# Garante que o diretório de uploads exista
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Recebe um arquivo, salva em disco com um nome único e retorna a URL de acesso.
    """
    # Gera um nome de arquivo único para evitar conflitos
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        # Salva o arquivo em disco
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Não foi possível salvar o arquivo: {e}")

    # Retorna o nome original e a URL para acessar o arquivo
    return {
        "fileName": file.filename,
        "fileUrl": f"/uploads/{unique_filename}" # URL relativa que será servida estaticamente
    }
