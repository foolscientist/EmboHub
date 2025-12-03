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
