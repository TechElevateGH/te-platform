import app.ents.application.models as application_models
import app.ents.application.schema as application_schema


def parse_application(application: application_models.Application):
    """Convert Application model to ApplicationRead schema"""
    # Convert ObjectId to string for the id field
    application_dict = {
        "id": str(application.id),
        "title": application.title,
        "company": application.company,
        "location": application.location,
        "date": application.date,
        "notes": application.notes,
        "recruiter_name": application.recruiter_name,
        "recruiter_email": application.recruiter_email,
        "role": application.role,
        "status": application.status,
        "referred": application.referred,
        "active": application.active,
        "archived": application.archived,
    }
    return application_schema.ApplicationRead(**application_dict)
