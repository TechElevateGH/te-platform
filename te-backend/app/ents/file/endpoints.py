from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pymongo.database import Database

import app.core.storage as storage
import app.database.session as session

files_router = APIRouter(prefix="/files", tags=["Files"])


def _content_type(grid_out) -> str:
    content_type = getattr(grid_out, "content_type", None)
    if not content_type and grid_out.metadata:
        content_type = grid_out.metadata.get("contentType")
    return content_type or storage.DEFAULT_CONTENT_TYPE


def _file_response(
    db: Database,
    file_id: str,
    *,
    disposition: str,
    token: str | None = None,
) -> Response:
    grid_out = storage.get_file(db, file_id)
    if storage.requires_private_file_token(
        grid_out
    ) and not storage.has_valid_private_file_token(file_id, token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A valid resume access link is required",
        )
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
    token: str | None = Query(default=None),
) -> Response:
    """Serve a stored file inline, validating private-file capability links."""
    return _file_response(db, file_id, disposition="inline", token=token)


@files_router.get("/{file_id}/download")
def download_file(
    *,
    db: Database = Depends(session.get_db),
    file_id: str,
    token: str | None = Query(default=None),
) -> Response:
    """Serve a stored file as a download attachment."""
    return _file_response(db, file_id, disposition="attachment", token=token)
