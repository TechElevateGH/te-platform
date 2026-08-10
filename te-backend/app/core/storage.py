"""MongoDB (GridFS) backed file storage.

Uploaded files (resumes, lesson material, other member files) are stored
directly in MongoDB using GridFS instead of an external provider, so the
platform has no third-party storage dependency.
"""

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from gridfs import GridFS, GridOut
from pydantic import BaseModel
from pymongo.database import Database

from app.core.settings import settings

BUCKET_NAME = "files"
DEFAULT_CONTENT_TYPE = "application/octet-stream"

# Folder labels used to group stored files (replaces the Google Drive folders).
RESUMES_FOLDER = "resumes"
OTHER_FILES_FOLDER = "other-files"
LESSONS_FOLDER = "lessons"


class StoredFile(BaseModel):
    file_id: str
    name: str
    link: str
    content_type: str = DEFAULT_CONTENT_TYPE
    size: int = 0


def get_fs(db: Database) -> GridFS:
    """Return the GridFS handle used for all platform file storage."""
    return GridFS(db, collection=BUCKET_NAME)


def file_path(file_id: str) -> str:
    """Relative API path that serves the given stored file."""
    return f"{settings.API_STR}/files/{file_id}"


def absolute_link(request: Any, link: Optional[str]) -> str:
    """Resolve a stored link against the current request.

    Links produced by this module are stored as relative API paths so they
    keep working across environments. Legacy absolute links (e.g. old Google
    Drive URLs) are returned unchanged.
    """
    if not link:
        return ""
    if link.startswith("http://") or link.startswith("https://"):
        return link
    if request is None:
        return link

    base = str(request.base_url).rstrip("/")
    # Honour proxy headers (Render/other reverse proxies) so links stay https.
    headers = getattr(request, "headers", {}) or {}
    forwarded_proto = headers.get("x-forwarded-proto")
    if forwarded_proto:
        scheme = forwarded_proto.split(",")[0].strip()
        if scheme and base.startswith("http://") and scheme == "https":
            base = "https://" + base[len("http://") :]

    return base + "/" + link.lstrip("/")


def _to_object_id(file_id: str) -> ObjectId:
    try:
        return ObjectId(file_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )


def save_file(
    db: Database,
    file,
    *,
    folder: str,
    metadata: Optional[dict] = None,
) -> StoredFile:
    """Persist an UploadFile in GridFS and return its metadata."""
    contents = file.file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty"
        )

    filename = file.filename or "file"
    content_type = getattr(file, "content_type", None) or DEFAULT_CONTENT_TYPE

    file_id = get_fs(db).put(
        contents,
        filename=filename,
        contentType=content_type,
        folder=folder,
        uploaded_at=datetime.utcnow().isoformat(),
        metadata=metadata or {},
    )

    stored_id = str(file_id)
    return StoredFile(
        file_id=stored_id,
        name=filename,
        link=file_path(stored_id),
        content_type=content_type,
        size=len(contents),
    )


def get_file(db: Database, file_id: str) -> GridOut:
    """Fetch a stored file, raising a 404 when it does not exist."""
    fs = get_fs(db)
    oid = _to_object_id(file_id)
    if not fs.exists(oid):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )
    return fs.get(oid)


def delete_file(db: Database, file_id: Optional[str]) -> bool:
    """Delete a stored file. Returns False when the id is not a stored file."""
    if not file_id:
        return False
    try:
        oid = ObjectId(file_id)
    except (InvalidId, TypeError):
        # Legacy (non-GridFS) identifiers are ignored.
        return False

    fs = get_fs(db)
    if not fs.exists(oid):
        return False

    fs.delete(oid)
    return True
