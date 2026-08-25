from fastapi import HTTPException, status

PDF_CONTENT_TYPE = "application/pdf"
MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024
_ALLOWED_UPLOAD_CONTENT_TYPES = {
    "",
    PDF_CONTENT_TYPE,
    "application/x-pdf",
    "application/octet-stream",
}


def _stream_size(stream) -> int:
    current_position = stream.tell()
    stream.seek(0, 2)
    size = stream.tell()
    stream.seek(current_position)
    return size


def is_pdf_stream(stream) -> bool:
    """Validate the structural markers expected in a PDF file."""
    current_position = stream.tell()
    size = _stream_size(stream)
    if size == 0:
        return False

    stream.seek(0)
    header = stream.read(min(size, 1024))
    stream.seek(max(0, size - 2048))
    trailer = stream.read()
    stream.seek(current_position)

    return b"%PDF-" in header and b"%%EOF" in trailer


def validate_pdf_upload(file) -> int:
    """Reject mislabeled, empty, or oversized resume uploads."""
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted. Please upload a PDF file.",
        )

    content_type = (getattr(file, "content_type", None) or "").lower()
    if content_type not in _ALLOWED_UPLOAD_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded resume must use the PDF content type.",
        )

    size = _stream_size(file.file)
    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF is empty.",
        )
    if size > MAX_RESUME_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Resume PDFs must be 10 MB or smaller.",
        )
    if not is_pdf_stream(file.file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid PDF.",
        )

    file.file.seek(0)
    return size
