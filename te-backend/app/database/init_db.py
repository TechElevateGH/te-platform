from app.core.settings import settings
from app.core.security import get_password_hash
import app.ents.user.schema as user_schema
from pymongo.database import Database
from datetime import date


def init_db(db: Database) -> None:
    """Initialize database with superuser"""
    users_collection = db["users"]

    # Check if superuser already exists
    superuser = users_collection.find_one({"email": settings.FIRST_SUPERUSER_EMAIL})

    if not superuser:
        user_data = {
            "email": settings.FIRST_SUPERUSER_EMAIL,
            "first_name": settings.FIRST_SUPERUSER_FIRST_NAME,
            "last_name": settings.FIRST_SUPERUSER_LAST_NAME,
            "middle_name": "",
            "full_name": f"{settings.FIRST_SUPERUSER_FIRST_NAME} {settings.FIRST_SUPERUSER_LAST_NAME}",
            "password": get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            "role": user_schema.UserRoles.admin.value,
            "contact": "",
            "address": "",
            "university": "",
            "image": "",
            "date_of_birth": "",
            "essay": "",
            "mentor_id": None,
            "is_active": True,
            "start_date": date.today().strftime("%d-%m-%Y"),
            "end_date": "",
        }

        result = users_collection.insert_one(user_data)
        print(
            f"✓ Superuser created: {settings.FIRST_SUPERUSER_EMAIL} (ID: {result.inserted_id})"
        )
    else:
        print(f"✓ Superuser already exists: {settings.FIRST_SUPERUSER_EMAIL}")
