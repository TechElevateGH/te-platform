import app.ents.user.crud as user_crud
import app.ents.user.schema as user_schema
from app.core.settings import settings
from sqlalchemy.orm import Session


from app.database import base  # noqa


def init_db(db: Session) -> None:
    """Initialize database with superuser"""
    superuser = user_crud.read_user_by_email(
        db=db, email=settings.FIRST_SUPERUSER_EMAIL
    )
    if not superuser:
        user_in = user_schema.UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            first_name=settings.FIRST_SUPERUSER_FIRST_NAME,
            last_name=settings.FIRST_SUPERUSER_LAST_NAME,
            full_name=f"{settings.FIRST_SUPERUSER_FIRST_NAME} {settings.FIRST_SUPERUSER_LAST_NAME}",
            password=settings.FIRST_SUPERUSER_PASSWORD,
            role=user_schema.UserRoles.admin,
            contact="",
            address="",
            university="",
        )
        superuser = user_crud.create_user(db, data=user_in)
        print(f"✓ Superuser created: {superuser.email}")
