import app.ents.application.models as application_models
import app.ents.application.schema as application_schema
import app.ents.referralcompany.schema as referralcompany_schema


def parse_application(application: application_models.Application):
    application_base = application_schema.ApplicationReadBase(**vars(application))
    new_application = application_schema.ApplicationRead(
        **application_base.dict(),
        company=referralcompany_schema.CompanyReadBase(**vars(application.company)),
        location=referralcompany_schema.LocationRead(**vars(application.location)),
    )
    return new_application
