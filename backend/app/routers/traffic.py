from fastapi import APIRouter
from ..routers.files import ACTIVE


router = APIRouter(prefix="/system", tags=["system"])


@router.get("/traffic")
def traffic():
    items = []
    for k, v in list(ACTIVE.items())[:20]:
        t = v.get("total", 0) or 0
        b = v.get("bytes", 0) or 0
        pct = (b * 100 // t) if t else 0
        items.append({
            "file_id": v.get("file_id"),
            "filename": v.get("filename"),
            "bytes": b,
            "total": t,
            "percent": pct,
            "started_at": v.get("started_at")
        })
    return {"active": items, "capacity": 5, "active_count": len(items)}
