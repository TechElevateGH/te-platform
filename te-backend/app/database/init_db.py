from app.core.settings import settings
from app.core.security import get_password_hash
import app.ents.user.schema as user_schema
from pymongo.database import Database
from datetime import date


def init_db(db: Database) -> None:
    """Initialize database with default users"""
    users_collection = db["users"]

    # 1. Create Admin user with username/token
    admin_user = users_collection.find_one({"username": "admin"})
    if not admin_user:
        admin_token = "bethel"
        admin_data = {
            "email": "admin@techelevate.org",
            "username": "admin",
            "lead_token": admin_token,
            "first_name": "Admin",
            "last_name": "User",
            "middle_name": "",
            "full_name": "Admin User",
            "password": get_password_hash(admin_token),  # Use token as password hash
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
        result = users_collection.insert_one(admin_data)
        print(
            f"✓ Admin created: admin / token: {admin_token} (ID: {result.inserted_id})"
        )
    else:
        print("✓ Admin user already exists: admin")

    # 2. Create Lead user with username/token
    lead_user = users_collection.find_one({"username": "lead"})
    if not lead_user:
        lead_token = "shiloh"
        lead_data = {
            "email": "lead@techelevate.org",
            "username": "lead",
            "lead_token": lead_token,
            "first_name": "Lead",
            "last_name": "User",
            "middle_name": "",
            "full_name": "Lead User",
            "password": get_password_hash(lead_token),  # Use token as password hash
            "role": user_schema.UserRoles.lead.value,
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
        result = users_collection.insert_one(lead_data)
        print(f"✓ Lead created: lead / token: {lead_token} (ID: {result.inserted_id})")
    else:
        print("✓ Lead user already exists: lead")

    # 3. Create Member user with email/password
    member_user = users_collection.find_one({"email": "info@techelevate.org"})
    if not member_user:
        member_password = "password123"  # Default password
        member_data = {
            "email": "info@techelevate.org",
            "first_name": "C",
            "last_name": "B",
            "middle_name": "",
            "full_name": "C B",
            "password": get_password_hash(member_password),
            "role": user_schema.UserRoles.member.value,
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
        result = users_collection.insert_one(member_data)
        print(
            f"✓ Member created: info@techelevate.org / password: {member_password} (ID: {result.inserted_id})"
        )
    else:
        print("✓ Member user already exists: info@techelevate.org")

    # 4. Also create original superuser if configured
    if settings.FIRST_SUPERUSER_EMAIL:
        superuser = users_collection.find_one({"email": settings.FIRST_SUPERUSER_EMAIL})
        if not superuser and settings.FIRST_SUPERUSER_EMAIL != "info@techelevate.org":
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
        elif settings.FIRST_SUPERUSER_EMAIL != "info@techelevate.org":
            print(f"✓ Superuser already exists: {settings.FIRST_SUPERUSER_EMAIL}")
