from urllib.parse import quote

from fastapi import APIRouter, Depends, Response
from pymongo.database import Database

import app.core.storage as storage
import app.database.session as session

files_router = APIRouter(prefix="/files", tags=["Files"])


def _content_type(grid_out) -> str:
    content_type = getattr(grid_out, "content_type", None)
    if not content_type and grid_out.metadata:
        content_type = grid_out.metadata.get("contentType")
    return content_type or storage.DEFAULT_CONTENT_TYPE


def _file_response(db: Database, file_id: str, *, disposition: str) -> Response:
    grid_out = storage.get_file(db, file_id)
    filename = grid_out.filename or "file"

    return Response(
        content=grid_out.read(),
        media_type=_content_type(grid_out),
        headers={
            "Content-Disposition": f"{disposition}; filename*=UTF-8''{quote(filename)}",
            "Cache-Control": "private, max-age=300",
        },
    )


@files_router.get("/{file_id}")
def get_file(
    *,
    db: Database = Depends(session.get_db),
    file_id: str,
) -> Response:
    """Serve a stored file inline (viewable in the browser)."""
    return _file_response(db, file_id, disposition="inline")


@files_router.get("/{file_id}/download")
def download_file(
    *,
    db: Database = Depends(session.get_db),
    file_id: str,
) -> Response:
    """Serve a stored file as a download attachment."""
    return _file_response(db, file_id, disposition="attachment")
