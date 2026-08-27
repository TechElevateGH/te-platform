import unittest
from types import SimpleNamespace

from bson import ObjectId
from fastapi import HTTPException

from app.ents.user import crud as user_crud
from app.ents.user import endpoints as user_endpoints


class FakeCursor(list):
    def sort(self, *_args):
        return self


class FakePrivilegedUsers:
    def __init__(self, users):
        self.users = users
        self.last_query = None

    def find(self, query):
        self.last_query = query
        if query.get("is_active") is True:
            return FakeCursor(user for user in self.users if user.get("is_active", True))
        return FakeCursor(self.users)


class FakeDatabase:
    def __init__(self, users):
        self.privileged_users = FakePrivilegedUsers(users)


class UserManagementTests(unittest.TestCase):
    def setUp(self):
        self.company_id = ObjectId()
        self.database = FakeDatabase(
            [
                {
                    "_id": ObjectId(),
                    "username": "active-volunteer",
                    "role": 3,
                    "is_active": True,
                },
                {
                    "_id": ObjectId(),
                    "username": "inactive-referrer",
                    "role": 2,
                    "is_active": False,
                    "company_id": self.company_id,
                    "company_name": "Example Corp",
                },
            ]
        )

    def test_assignment_list_excludes_inactive_accounts_by_default(self):
        users = user_crud.read_all_privileged_users(self.database)

        self.assertEqual(self.database.privileged_users.last_query, {"is_active": True})
        self.assertEqual([user["username"] for user in users], ["active-volunteer"])

    def test_account_management_can_include_inactive_accounts(self):
        users = user_crud.read_all_privileged_users(
            self.database, include_inactive=True
        )

        self.assertEqual(self.database.privileged_users.last_query, {})
        self.assertEqual(len(users), 2)
        inactive_user = next(
            user for user in users if user["username"] == "inactive-referrer"
        )
        self.assertEqual(inactive_user["company_id"], str(self.company_id))
        self.assertEqual(inactive_user["company_name"], "Example Corp")

    def test_leads_cannot_request_inactive_privileged_accounts(self):
        with self.assertRaises(HTTPException) as error:
            user_endpoints.list_privileged_users(
                db=self.database,
                include_inactive=True,
                current_user=SimpleNamespace(role=4),
            )

        self.assertEqual(error.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
