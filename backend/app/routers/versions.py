from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Version, Model, User
from ..schemas import VersionCreate, VersionOut
from ..auth import get_current_user


router = APIRouter(prefix="/versions", tags=["versions"])


@router.post("/model/{model_id}", response_model=VersionOut)
def create_version(model_id: int, payload: VersionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404)
    v = Version(model_id=model_id, version=payload.version, status="draft", is_latest=False)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.post("/{version_id}/release", response_model=VersionOut)
def release_version(version_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = db.query(Version).filter(Version.id == version_id).first()
    if not v:
        raise HTTPException(status_code=404)
    v.status = "released"
    db.commit()
    db.refresh(v)
    return v


@router.post("/{version_id}/mark_latest", response_model=VersionOut)
def mark_latest(version_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = db.query(Version).filter(Version.id == version_id).first()
    if not v:
        raise HTTPException(status_code=404)
    db.query(Version).filter(Version.model_id == v.model_id).update({Version.is_latest: False})
    v.is_latest = True
    db.commit()
    db.refresh(v)
    return v
