from pydantic import BaseModel
from typing import Optional, List


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class ModelCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""
    tags: Optional[str] = ""


# class ModelInfoTag(BaseModel):
#     capabilities: str
#     action: Optional[str] = None
#     target_object: Optional[str] = None
#     language: Optional[str] = None
#     host_device: Optional[str] = None
#     scenario: Optional[str] = None


class ModelInfoMetric(BaseModel):
    parameters: Optional[int] = None
    quantatization: Optional[str] = None
    gpu_memory_gb: Optional[float] = None
    storage_gb: Optional[float] = None


class ModelInfo(BaseModel):
    id: Optional[int] = None
    name: str
    fullname: str
    architecture: str
    framework: str
    version: str
    description: str = ""
    tags: dict
    metrics: ModelInfoMetric


class ModelOut(BaseModel):
    id: int
    name: str
    slug: str
    owner_id: int
    description: str
    tags: str
    download_count: int

    class Config:
        from_attributes = True


class VersionCreate(BaseModel):
    version: str


class VersionOut(BaseModel):
    id: int
    model_id: int
    version: str
    status: str
    is_latest: bool

    class Config:
        from_attributes = True


class FileOut(BaseModel):
    id: int
    version_id: int
    filename: str
    size: int
    sha256: str
    mime: str

    class Config:
        from_attributes = True
