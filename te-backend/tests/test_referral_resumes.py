import io
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from bson import ObjectId
from fastapi import HTTPException

from app.core import storage
from app.ents.referral import crud as referral_crud
from app.ents.referral import dependencies as referral_dependencies
from app.ents.referral import schema as referral_schema
from app.ents.file import endpoints as file_endpoints
from app.ents.resume import crud as resume_crud
from app.ents.resume.validation import validate_pdf_upload


VALID_PDF = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"


class StoredPdf(io.BytesIO):
    filename = "resume.pdf"
    content_type = "application/pdf"
    metadata = {"kind": "resume", "private": True}

    def __init__(self, contents=VALID_PDF):
        super().__init__(contents)
        self._file = {
            "folder": storage.RESUMES_FOLDER,
            "metadata": {"kind": "resume", "private": True},
        }


class MemberUsers:
    def __init__(self, resume):
        self.resume = resume

    def find_one(self, query, projection=None):
        if query.get("resumes.id") != self.resume["id"]:
            return None
        return {"resumes": [self.resume]}


class ReferralCompanies:
    def find_one(self, query, **kwargs):
        return {
            "name": "Microsoft",
            "can_refer": True,
            "referral_materials": {"resume": True},
        }


class Referrals:
    def __init__(self):
        self.document = None

    def insert_one(self, document):
        self.document = {"_id": ObjectId(), **document}
        return SimpleNamespace(inserted_id=self.document["_id"])

    def find_one(self, query, projection=None):
        return self.document


class FakeDatabase:
    def __init__(self, resume):
        self.member_users = MemberUsers(resume)
        self.referral_companies = ReferralCompanies()
        self.referrals = Referrals()


class ReferralResumeTests(unittest.TestCase):
    def setUp(self):
        self.user_id = str(ObjectId())
        self.file_id = str(ObjectId())
        self.resume = {
            "id": "resume-1",
            "file_id": self.file_id,
            "name": "software-engineer.pdf",
            "storage": "mongodb",
            "content_type": "application/pdf",
            "archived": False,
        }

    def test_accepts_real_pdf_upload(self):
        upload = SimpleNamespace(
            filename="resume.pdf",
            content_type="application/pdf",
            file=io.BytesIO(VALID_PDF),
        )

        self.assertEqual(validate_pdf_upload(upload), len(VALID_PDF))
        self.assertEqual(upload.file.tell(), 0)

    def test_rejects_non_pdf_content_with_pdf_extension(self):
        upload = SimpleNamespace(
            filename="resume.pdf",
            content_type="application/pdf",
            file=io.BytesIO(b"not a PDF"),
        )

        with self.assertRaises(HTTPException) as error:
            validate_pdf_upload(upload)

        self.assertEqual(error.exception.status_code, 400)

    def test_private_file_token_is_bound_to_file_id(self):
        token = storage.private_file_token(self.file_id)

        self.assertTrue(storage.has_valid_private_file_token(self.file_id, token))
        self.assertFalse(
            storage.has_valid_private_file_token(str(ObjectId()), token)
        )
        self.assertEqual(
            storage.file_id_from_link(storage.private_file_path(self.file_id)),
            self.file_id,
        )

    @patch("app.ents.file.endpoints.storage.get_file")
    def test_private_resume_file_requires_capability_token(self, get_file):
        get_file.return_value = StoredPdf()

        with self.assertRaises(HTTPException) as error:
            file_endpoints._file_response(
                SimpleNamespace(),
                self.file_id,
                disposition="inline",
            )

        self.assertEqual(error.exception.status_code, 403)
        response = file_endpoints._file_response(
            SimpleNamespace(),
            self.file_id,
            disposition="inline",
            token=storage.private_file_token(self.file_id),
        )
        self.assertEqual(response.media_type, "application/pdf")

    @patch("app.ents.referral.crud.user_crud.read_user_by_id")
    @patch("app.ents.referral.crud.storage.get_file")
    def test_referral_persists_member_owned_gridfs_pdf(
        self,
        get_file,
        read_user,
    ):
        get_file.return_value = StoredPdf()
        read_user.return_value = SimpleNamespace(id=self.user_id)
        db = FakeDatabase(self.resume)
        request = referral_schema.ReferralRequest(
            company_id="Microsoft",
            job_title="Software Engineer",
            role="New Grad",
            request_note="",
            resume_id=self.resume["id"],
        )

        referral = referral_crud.request_referral(
            db,
            user_id=self.user_id,
            data=request,
        )

        self.assertEqual(referral.resume_file_id, self.file_id)
        self.assertEqual(referral.resume, storage.file_path(self.file_id))
        self.assertEqual(referral.resume_content_type, "application/pdf")
        parsed_referral = referral_dependencies.parse_referral(referral)
        self.assertIn("token=", parsed_referral.resume)

    @patch("app.ents.referral.crud.storage.get_file")
    def test_referral_rejects_resume_not_owned_by_member(self, get_file):
        db = FakeDatabase(self.resume)

        with self.assertRaises(HTTPException) as error:
            referral_crud.resolve_referral_resume(
                db,
                user_id=self.user_id,
                resume_id="another-resume",
            )

        self.assertEqual(error.exception.status_code, 400)
        get_file.assert_not_called()

    @patch("app.ents.resume.crud.storage.delete_file")
    def test_deleting_resume_keeps_file_attached_to_referral(self, delete_file):
        member_users = SimpleNamespace(
            find_one=lambda *args, **kwargs: {"resumes": [self.resume]},
            update_one=lambda *args, **kwargs: SimpleNamespace(modified_count=1),
        )
        referrals = SimpleNamespace(
            find_one=lambda *args, **kwargs: {"_id": ObjectId()},
        )
        db = SimpleNamespace(member_users=member_users, referrals=referrals)

        deleted = resume_crud.delete_resume(
            db,
            resume_id=self.resume["id"],
            user_id=self.user_id,
        )

        self.assertTrue(deleted)
        delete_file.assert_not_called()


if __name__ == "__main__":
    unittest.main()
