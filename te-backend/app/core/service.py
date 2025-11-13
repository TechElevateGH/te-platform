from google.oauth2 import service_account
from googleapiclient.discovery import build
from app.core.settings import settings


def get_drive_service():
    """
    Get Google Drive service using credentials from environment variables.
    """
    credentials_info = {
        "type": settings.GOOGLE_TYPE,
        "project_id": settings.GOOGLE_PROJECT_ID,
        "private_key_id": settings.GOOGLE_PRIVATE_KEY_ID,
        "private_key": settings.GOOGLE_PRIVATE_KEY.replace('\\n', '\n'),  # Handle escaped newlines
        "client_email": settings.GOOGLE_CLIENT_EMAIL,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "auth_uri": settings.GOOGLE_AUTH_URI,
        "token_uri": settings.GOOGLE_TOKEN_URI,
        "auth_provider_x509_cert_url": settings.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": settings.GOOGLE_CLIENT_X509_CERT_URL,
        "universe_domain": settings.GOOGLE_UNIVERSE_DOMAIN
    }
    
    creds = service_account.Credentials.from_service_account_info(credentials_info)
    drive_service = build("drive", "v3", credentials=creds)
    return drive_service
