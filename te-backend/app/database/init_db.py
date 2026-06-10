import logging

import app.ents.user.schema as user_schema
from app.core.security import get_password_hash
from app.core.settings import settings
from pymongo.database import Database

logger = logging.getLogger(__name__)


def init_db(db: Database) -> None:
    """Initialize database with bootstrap admin credentials from environment."""
    privileged_users_collection = db["privileged_users"]

    admin_username = (settings.ADMIN_BOOTSTRAP_USERNAME or "").strip().lower()
    admin_token_secret = settings.ADMIN_BOOTSTRAP_TOKEN
    admin_token = (
        admin_token_secret.get_secret_value().strip() if admin_token_secret else ""
    )

    if not admin_username or not admin_token:
        logger.warning(
            "✗ Skipping admin bootstrap: set ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_TOKEN in the environment."
        )
        return

    admin_user = privileged_users_collection.find_one({"username": admin_username})
    if not admin_user:
        admin_data = {
            "username": admin_username,
            "password": get_password_hash(admin_token),
            "role": user_schema.UserRoles.admin.value,
            "company_id": None,
            "is_active": True,
        }
        result = privileged_users_collection.insert_one(admin_data)
        logger.info("✓ Admin created: %s (ID: %s)", admin_username, result.inserted_id)
    else:
        logger.info("✓ Admin user already exists: %s", admin_username)

    # Security migration: purge any plaintext lead_token fields from existing docs
    purge_result = privileged_users_collection.update_many(
        {"lead_token": {"$exists": True}},
        {"$unset": {"lead_token": ""}},
    )
    if purge_result.modified_count > 0:
        logger.info(
            "✓ Purged plaintext lead_token from %d privileged user(s)",
            purge_result.modified_count,
        )

    # Ensure TTL index on oauth_codes for automatic expiry
    db.oauth_codes.create_index("created_at", expireAfterSeconds=120)
