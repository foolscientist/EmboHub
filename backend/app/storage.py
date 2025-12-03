import os
import hashlib
from typing import Tuple
import inspect
import asyncio
from .config import STORAGE_DIR, STORAGE_BACKEND, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_SECURE


def _ensure_local():
    os.makedirs(STORAGE_DIR, exist_ok=True)


def _save_local(tmp_path: str, sha: str, filename: str) -> str:
    dest_dir = os.path.join(STORAGE_DIR, sha)
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, filename)
    os.replace(tmp_path, dest_path)
    return dest_path


def save_stream(filename: str, chunk_iter) -> Tuple[str, str, int]:
    hasher = hashlib.sha256()
    size = 0
    tmp_path = os.path.join(STORAGE_DIR, f"tmp_{filename}")
    _ensure_local()
    # Support both sync and async generators
    if inspect.isasyncgen(chunk_iter):
        raise RuntimeError("use save_stream_async for async generators")
    else:
        with open(tmp_path, "wb") as out:
            for chunk in chunk_iter:
                out.write(chunk)
                hasher.update(chunk)
                size += len(chunk)
    sha = hasher.hexdigest()
    if STORAGE_BACKEND == "s3" and S3_ENDPOINT and S3_BUCKET and S3_ACCESS_KEY and S3_SECRET_KEY:
        from minio import Minio
        client = Minio(S3_ENDPOINT, access_key=S3_ACCESS_KEY, secret_key=S3_SECRET_KEY, secure=S3_SECURE)
        if not client.bucket_exists(S3_BUCKET):
            client.make_bucket(S3_BUCKET)
        object_name = f"{sha}/{filename}"
        with open(tmp_path, "rb") as data:
            client.put_object(S3_BUCKET, object_name, data, length=size, part_size=10 * 1024 * 1024)
        os.remove(tmp_path)
        storage_uri = f"s3://{S3_BUCKET}/{object_name}"
        return storage_uri, sha, size
    storage_uri = _save_local(tmp_path, sha, filename)
    return storage_uri, sha, size


async def save_stream_async(filename: str, achunk_iter) -> Tuple[str, str, int]:
    hasher = hashlib.sha256()
    size = 0
    tmp_path = os.path.join(STORAGE_DIR, f"tmp_{filename}")
    _ensure_local()
    loop = asyncio.get_running_loop()
    def write_open():
        return open(tmp_path, "wb")
    out = await loop.run_in_executor(None, write_open)
    try:
        async for chunk in achunk_iter:
            await loop.run_in_executor(None, out.write, chunk)
            hasher.update(chunk)
            size += len(chunk)
    finally:
        out.close()
    sha = hasher.hexdigest()
    if STORAGE_BACKEND == "s3" and S3_ENDPOINT and S3_BUCKET and S3_ACCESS_KEY and S3_SECRET_KEY:
        from minio import Minio
        client = Minio(S3_ENDPOINT, access_key=S3_ACCESS_KEY, secret_key=S3_SECRET_KEY, secure=S3_SECURE)
        if not client.bucket_exists(S3_BUCKET):
            client.make_bucket(S3_BUCKET)
        object_name = f"{sha}/{filename}"
        with open(tmp_path, "rb") as data:
            client.put_object(S3_BUCKET, object_name, data, length=size, part_size=10 * 1024 * 1024)
        os.remove(tmp_path)
        storage_uri = f"s3://{S3_BUCKET}/{object_name}"
        return storage_uri, sha, size
    storage_uri = _save_local(tmp_path, sha, filename)
    return storage_uri, sha, size


def parse_s3_uri(uri: str) -> Tuple[str, str]:
    if not uri.startswith("s3://"):
        return "", ""
    rest = uri[len("s3://"):]
    parts = rest.split("/", 1)
    bucket = parts[0]
    key = parts[1] if len(parts) > 1 else ""
    return bucket, key
