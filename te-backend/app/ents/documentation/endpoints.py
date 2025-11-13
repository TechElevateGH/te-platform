from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

DOCUMENTATION_DIR = Path(__file__).resolve().parent
DOCUMENTATION_FILE = DOCUMENTATION_DIR / "content.html"

documentation_router = APIRouter(prefix="/documentation", tags=["Documentation"])


@documentation_router.get("", response_class=HTMLResponse, include_in_schema=False)
async def render_documentation() -> HTMLResponse:
    """Serve the curated platform documentation as a standalone HTML page.

    Adds basic caching headers to improve mobile performance and reduce
    repeat fetch latency. The content is static until a deployment updates it.
    """
    if not DOCUMENTATION_FILE.exists():
        raise HTTPException(status_code=500, detail="Documentation asset missing")

    html = DOCUMENTATION_FILE.read_text(encoding="utf-8")
    return HTMLResponse(
        content=html,
        headers={
            "Cache-Control": "public, max-age=3600",  # 1 hour client/proxy cache
        },
    )
