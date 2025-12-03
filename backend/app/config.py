import os

DB_URL = os.getenv("DB_URL", "sqlite:///./app.db")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
STORAGE_DIR = os.getenv("STORAGE_DIR", "storage")
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "")
S3_BUCKET = os.getenv("S3_BUCKET", "")
S3_SECURE = os.getenv("S3_SECURE", "true").lower() == "true"
