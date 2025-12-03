from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, BigInteger, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), default="user", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Model(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, default="")
    tags = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    download_count = Column(BigInteger, default=0, nullable=False)

    owner = relationship("User")
    versions = relationship("Version", back_populates="model", cascade="all, delete-orphan")


class Version(Base):
    __tablename__ = "versions"
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False, index=True)
    version = Column(String(64), nullable=False)
    status = Column(String(16), default="draft", nullable=False)
    is_latest = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    model = relationship("Model", back_populates="versions")
    files = relationship("File", back_populates="version", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("model_id", "version", name="uq_model_version"),
    )


class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    version_id = Column(Integer, ForeignKey("versions.id"), nullable=False, index=True)
    filename = Column(String(512), nullable=False)
    size = Column(BigInteger, default=0, nullable=False)
    sha256 = Column(String(64), index=True, nullable=False)
    storage_uri = Column(String(1024), nullable=False)
    mime = Column(String(128), default="application/octet-stream", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    version = relationship("Version", back_populates="files")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(16), nullable=False)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)
    version_id = Column(Integer, ForeignKey("versions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
