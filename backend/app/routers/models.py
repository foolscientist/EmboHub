from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from fastapi import File as UploadFileType
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Model, User, Version, File, ModelBasic, ModelTags, ModelMetrics
from ..schemas import ModelCreate, ModelOut, FileOut, ModelInfo, ModelInfoMetric
from ..auth import get_current_user
from ..storage import save_stream_async, parse_s3_uri
from ..config import S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_SECURE
import os


router = APIRouter(prefix="/models", tags=["models"])


@router.post("", response_model=ModelOut)
def create_model(
    payload: ModelCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exists = db.query(Model).filter(Model.slug == payload.slug).first()
    if exists:
        raise HTTPException(status_code=400, detail="slug exists")
    model = Model(
        name=payload.name,
        slug=payload.slug,
        owner_id=user.id,
        description=payload.description or "",
        tags=payload.tags or "",
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.post("/experimental", response_model=ModelInfo)
def create_model_v2(
    payload: ModelInfo,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exists = (
        db.query(ModelBasic).filter(ModelBasic.fullname == payload.fullname).first()
    )
    if exists:
        raise HTTPException(
            status_code=400, detail="already exists a model with the same name"
        )
    model = ModelBasic(
        name=payload.name,
        fullname=payload.fullname,
        owner_id=user.id,
        description=payload.description or "",
        architecture=payload.architecture,
        framework=payload.framework or "",
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    # add tags
    for key, val in payload.tags.items():
        tag = ModelTags(id=model.id, key=key, val=val)
        db.add(tag)
    db.commit()
    # add metrics
    metrics = ModelMetrics(
        id=model.id,
        parameters=payload.metrics.parameters,
        quantatization=payload.metrics.quantatization,
        gpu_memory_gb=payload.metrics.gpu_memory_gb,
        storage_gb=payload.metrics.storage_gb,
    )
    db.add(metrics)
    db.commit()

    payload.id = model.id
    return payload


@router.get("", response_model=List[ModelOut])
def list_models(
    db: Session = Depends(get_db),
    query: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    sort: Optional[str] = Query("updated_at"),
):
    q = db.query(Model)
    if query:
        like = f"%{query}%"
        q = q.filter((Model.name.like(like)) | (Model.description.like(like)))
    if tags:
        for t in tags.split(","):
            q = q.filter(Model.tags.like(f"%{t.strip()}%"))
    if sort == "downloads":
        q = q.order_by(Model.download_count.desc())
    else:
        q = q.order_by(Model.updated_at.desc())
    return q.limit(100).all()


@router.get("/experimental", response_model=List[ModelOut])
def list_models_v2(
    db: Session = Depends(get_db),
    query: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    sort: Optional[str] = Query("updated_at"),
):
    q = db.query(ModelBasic)
    if query:
        like = f"%{query}%"
        q = q.filter((ModelBasic.name.like(like)) | (ModelBasic.description.like(like)))
    if tags:
        for t in tags.split(","):
            q = q.filter(ModelBasic.tags.like(f"%{t.strip()}%"))
    if sort == "downloads":
        q = q.order_by(ModelBasic.download_count.desc())
    else:
        q = q.order_by(ModelBasic.updated_at.desc())
    return q.limit(100).all()


@router.get("/{model_id}", response_model=ModelOut)
def get_model(model_id: int, db: Session = Depends(get_db)):
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"no such model of id {model_id}")
    return m


def gather_model_tags(model_id: int, db: Session) -> dict:
    q = db.query(ModelTags).filter(ModelTags.id == model_id)
    res = {}
    for row in q.all():
        res[q.key] = q.val
    return res


def gather_model_metrics(model_id: int, db: Session) -> ModelInfoMetric:
    m = db.query(ModelMetrics).filter(ModelMetrics.id == model_id).first()
    return ModelInfoMetric(
        parameters=m.parameters,
        quantatization=m.quantatization,
        gpu_memory_gb=m.gpu_memory_gb,
        storage_gb=m.storage_gb,
    )


def gather_model_version(model_id: int, db: Session) -> str:
    return db.query(Version).filter(Version.model_id == model_id).first().version


def model_basic_to_model_info(m: ModelBasic, db: Session) -> ModelInfo:
    tags = gather_model_tags(m.id, db)
    metrics = gather_model_metrics(m.id, db)
    return ModelInfo(
        id=m.id,
        name=m.name,
        fullname=m.fullname,
        architecture=m.architecture,
        framework=m.framework,
        version=gather_model_version(m.id, db),
        description=m.description,
        tags=tags,
        metrics=metrics,
    )


@router.get("/{model_id}/experimental", response_model=ModelInfo)
def get_model_v2(model_id: int, db: Session = Depends(get_db)):
    m = db.query(ModelBasic).filter(ModelBasic.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"no such model of id {model_id}")
    return model_basic_to_model_info(m, db)


# 版本列表接口已隐藏，采用单模型单文件简化模式


def ensure_single_version(db: Session, model_id: int) -> Version:
    v = (
        db.query(Version)
        .filter(Version.model_id == model_id, Version.version == "single")
        .first()
    )
    if v:
        return v
    v = Version(model_id=model_id, version="single", status="draft", is_latest=True)
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.get("/{model_id}/files", response_model=List[FileOut])
def list_model_files(model_id: int, db: Session = Depends(get_db)):
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404)
    v = (
        db.query(Version)
        .filter(Version.model_id == model_id, Version.version == "single")
        .first()
    )
    if not v:
        return []
    return (
        db.query(File)
        .filter(File.version_id == v.id)
        .order_by(File.created_at.asc())
        .all()
    )


@router.get("/{model_id}/files/experimental", response_model=List[FileOut])
def list_model_files(model_id: int, db: Session = Depends(get_db)):
    m = db.query(ModelBasic).filter(ModelBasic.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404)
    v = (
        db.query(Version)
        .filter(Version.model_id == model_id, Version.version == "single")
        .first()
    )
    if not v:
        return []
    return (
        db.query(File)
        .filter(File.version_id == v.id)
        .order_by(File.created_at.asc())
        .all()
    )


@router.post("/{model_id}/upload", response_model=FileOut)
async def upload_model_file(
    model_id: int,
    f: UploadFile = UploadFileType(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404)
    v = ensure_single_version(db, model_id)

    async def each_chunk(f):
        while True:
            chunk = await f.read(1024 * 1024)
            if not chunk:
                break
            yield chunk

    storage_uri, sha, size = await save_stream_async(f.filename, each_chunk(f))
    rec = File(
        version_id=v.id,
        filename=f.filename,
        size=size,
        sha256=sha,
        storage_uri=storage_uri,
        mime=f.content_type or "application/octet-stream",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.post("/{model_id}/upload/experimental", response_model=FileOut)
async def upload_model_file_v2(
    model_id: int,
    f: UploadFile = UploadFileType(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    m = db.query(ModelBasic).filter(ModelBasic.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"no model of id {model_id}")
    v = ensure_single_version(db, model_id)

    async def each_chunk(f):
        while True:
            chunk = await f.read(1024 * 1024)
            if not chunk:
                break
            yield chunk

    storage_uri, sha, size = await save_stream_async(f.filename, each_chunk(f))
    rec = File(
        version_id=v.id,
        filename=f.filename,
        size=size,
        sha256=sha,
        storage_uri=storage_uri,
        mime=f.content_type or "application/octet-stream",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.delete("/{model_id}")
def delete_model(
    model_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    if not user or user.role != "admin":
        raise HTTPException(status_code=403)
    m = db.query(Model).filter(Model.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404)
    # cleanup files storage
    versions = db.query(Version).filter(Version.model_id == model_id).all()
    for v in versions:
        files = db.query(File).filter(File.version_id == v.id).all()
        for rec in files:
            try:
                if rec.storage_uri and rec.storage_uri.startswith("s3://"):
                    bucket, key = parse_s3_uri(rec.storage_uri)
                    from minio import Minio

                    client = Minio(
                        S3_ENDPOINT,
                        access_key=S3_ACCESS_KEY,
                        secret_key=S3_SECRET_KEY,
                        secure=S3_SECURE,
                    )
                    client.remove_object(bucket, key)
                elif rec.storage_uri and os.path.exists(rec.storage_uri):
                    try:
                        os.remove(rec.storage_uri)
                    except Exception:
                        pass
            except Exception:
                pass
    # delete model cascades versions/files
    db.delete(m)
    db.commit()
    return {"ok": True}


@router.delete("/{model_id}/experimental")
def delete_model_v2(
    model_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    # if not user or user.role != "admin":
    #    raise HTTPException(status_code=403)
    m = db.query(ModelBasic).filter(ModelBasic.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404)
    # cleanup files storage
    versions = db.query(Version).filter(Version.model_id == model_id).all()
    for v in versions:
        files = db.query(File).filter(File.version_id == v.id).all()
        for rec in files:
            try:
                if rec.storage_uri and rec.storage_uri.startswith("s3://"):
                    bucket, key = parse_s3_uri(rec.storage_uri)
                    from minio import Minio

                    client = Minio(
                        S3_ENDPOINT,
                        access_key=S3_ACCESS_KEY,
                        secret_key=S3_SECRET_KEY,
                        secure=S3_SECURE,
                    )
                    client.remove_object(bucket, key)
                elif rec.storage_uri and os.path.exists(rec.storage_uri):
                    try:
                        os.remove(rec.storage_uri)
                    except Exception:
                        pass
            except Exception:
                pass
    # delete model cascades versions/files
    db.delete(m)
    db.commit()
    return {"ok": True}
