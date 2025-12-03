import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import File, Version, Model
from ..config import S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_SECURE
from ..storage import parse_s3_uri


router = APIRouter(prefix="/files", tags=["files"])


def ensure_storage(path: str):
    os.makedirs(path, exist_ok=True)


# 上传接口已转移到 /models/{id}/upload，保留下载接口


@router.get("/{file_id}/download")
def download_file(file_id: int, db: Session = Depends(get_db)):
    fl = db.query(File).filter(File.id == file_id).first()
    if not fl:
        raise HTTPException(status_code=404)
    if fl.storage_uri.startswith("s3://"):
        bucket, key = parse_s3_uri(fl.storage_uri)
        if not bucket or not key:
            raise HTTPException(status_code=404)
        from minio import Minio
        client = Minio(S3_ENDPOINT, access_key=S3_ACCESS_KEY, secret_key=S3_SECRET_KEY, secure=S3_SECURE)
        url = client.presigned_get_object(bucket, key, expires=3600)
        m = db.query(Model).join(Version, Version.model_id == Model.id).filter(Version.id == fl.version_id).first()
        if m:
            m.download_count = (m.download_count or 0) + 1
            db.commit()
        return RedirectResponse(url)
    if not os.path.exists(fl.storage_uri):
        raise HTTPException(status_code=404)
    m = db.query(Model).join(Version, Version.model_id == Model.id).filter(Version.id == fl.version_id).first()
    if m:
        m.download_count = (m.download_count or 0) + 1
        db.commit()
    return FileResponse(fl.storage_uri, filename=fl.filename, media_type=fl.mime)


# 版本文件列表接口已移除，统一从 /models/{id}/files 获取


@router.delete("/{file_id}")
def delete_file_record(file_id: int, db: Session = Depends(get_db)):
    rec = db.query(File).filter(File.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404)
    try:
        if rec.storage_uri and rec.storage_uri.startswith("s3://"):
            bucket, key = parse_s3_uri(rec.storage_uri)
            from minio import Minio
            client = Minio(S3_ENDPOINT, access_key=S3_ACCESS_KEY, secret_key=S3_SECRET_KEY, secure=S3_SECURE)
            client.remove_object(bucket, key)
        elif rec.storage_uri and os.path.exists(rec.storage_uri):
            try:
                os.remove(rec.storage_uri)
            except Exception:
                pass
    finally:
        db.delete(rec)
        db.commit()
    return {"ok": True}
