import os
from fastapi import FastAPI
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, SessionLocal
from .models import User
from .auth import hash_password
from .config import STORAGE_DIR
from .routers import auth, models, files, traffic


app = FastAPI(title="Model Repo")


Base.metadata.create_all(bind=engine)
os.makedirs(STORAGE_DIR, exist_ok=True)

# Create default admin account if not exists
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
try:
    with SessionLocal() as db:
        exists_admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if not exists_admin:
            admin = User(username=ADMIN_USERNAME, password_hash=hash_password(ADMIN_PASSWORD), role="admin")
            db.add(admin)
            db.commit()
except Exception:
    pass


app.include_router(auth.router)
app.include_router(models.router)
app.include_router(files.router)
app.include_router(traffic.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static web UI (HTML/CSS/JS)
WEB_DIR = str((Path(__file__).resolve().parents[2] / "web").resolve())
app.mount("/ui", StaticFiles(directory=WEB_DIR, html=True), name="ui")


@app.get("/system/health")
def system_health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"db": db_status, "storage_dir": STORAGE_DIR}
