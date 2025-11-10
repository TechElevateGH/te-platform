from app.core.security import get_password_hash
import app.ents.user.schema as user_schema
from pymongo.database import Database
from datetime import date


def init_db(db: Database) -> None:
    """Initialize database with default users and privileged accounts"""
    users_collection = db["member_users"]
    privileged_users_collection = db["privileged_users"]
    companies_collection = db["companies"]

    # 1. Create Admin privileged user with username/token
    admin_user = privileged_users_collection.find_one({"username": "admin"})
    if not admin_user:
        admin_token = "bethel"
        admin_data = {
            "username": "admin",
            "lead_token": admin_token,
            "password": get_password_hash(admin_token),
            "role": user_schema.UserRoles.admin.value,
            "company_id": None,
            "is_active": True,
        }
        result = privileged_users_collection.insert_one(admin_data)
        print(
            f"✓ Admin created: admin / token: {admin_token} (ID: {result.inserted_id})"
        )
    else:
        print("✓ Admin user already exists: admin")

    # 2. Create Lead privileged user with username/token
    lead_user = privileged_users_collection.find_one({"username": "lead"})
    if not lead_user:
        lead_token = "shiloh"
        lead_data = {
            "username": "lead",
            "lead_token": lead_token,
            "password": get_password_hash(lead_token),
            "role": user_schema.UserRoles.lead.value,
            "company_id": None,
            "is_active": True,
        }
        result = privileged_users_collection.insert_one(lead_data)
        print(f"✓ Lead created: lead / token: {lead_token} (ID: {result.inserted_id})")
    else:
        print("✓ Lead user already exists: lead")

    # 3. Create Amazon company for referrer
    amazon_company = companies_collection.find_one({"name": "Amazon"})
    if not amazon_company:
        amazon_data = {
            "name": "Amazon",
            "domain": "amazon.com",
            "image": "",
            "can_refer": True,
            "locations": [],
            "referral_materials": {
                "resume": True,
                "essay": True,
                "contact": True,
            },
            "metadata": {
                "description": "E-commerce and cloud computing company",
                "industry": "Technology",
                "size": "1,000,000+",
                "headquarters": "Seattle, WA",
            },
        }
        result = companies_collection.insert_one(amazon_data)
        amazon_id = result.inserted_id
        print(f"✓ Amazon company created (ID: {amazon_id})")
    else:
        amazon_id = amazon_company["_id"]
        print("✓ Amazon company already exists")

    # 4. Create Referrer user for Amazon
    referrer_user = privileged_users_collection.find_one({"username": "amzn"})
    if not referrer_user:
        referrer_token = "banana"
        referrer_data = {
            "username": "amzn",
            "lead_token": referrer_token,
            "password": get_password_hash(referrer_token),
            "role": user_schema.UserRoles.referrer.value,
            "company_id": amazon_id,
            "is_active": True,
        }
        result = privileged_users_collection.insert_one(referrer_data)
        print(
            f"✓ Referrer created: amzn / token: {referrer_token} for Amazon (ID: {result.inserted_id})"
        )
    else:
        print("✓ Referrer user already exists: amzn")

    # 5. Create Member user with email/password
    member_user = users_collection.find_one({"email": "info@techelevate.org"})
    if not member_user:
        member_password = "password123"
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
            "essay": "",
            "cover_letter": "",
            "resume_file_ids": [],
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
