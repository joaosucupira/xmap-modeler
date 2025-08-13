from typing import Any, Dict, Type
from sqlalchemy.orm import Session
from fastapi import HTTPException

def validate_entity(db: Session, entity_id: int, entity_class: Type[Any]):
    entity = db.query(entity_class).filter(entity_class.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f'{entity_class.__name__} não encontrado.')
    return entity





# def validate_entity(db: Session, entity_id: int, entity_class: Type[Any], updates: Dict[str, Any]):
    # for field, value in updates.items():
    #     if value is not None:
    #         setattr(entity, field, value)