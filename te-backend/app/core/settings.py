import json
from typing import Optional, Union

from pydantic import (
    AnyHttpUrl,
    EmailStr,
    SecretStr,
    field_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, env_file_encoding="utf-8"
    )

    API_STR: str
    PROJECT_NAME: str
    SERVER_HOST: str
    DOMAIN: str
    PORT: int = 8000

    SECRET_KEY: str
    AUTHJWT_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    BACKEND_CORS_ORIGINS: Union[str, list[AnyHttpUrl]] = "http://localhost:3000"

    ADMIN_BOOTSTRAP_USERNAME: Optional[str] = None
    ADMIN_BOOTSTRAP_TOKEN: Optional[SecretStr] = None

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list]) -> Union[list[str], list]:
        if isinstance(v, str):
            cleaned = v.strip()
            if not cleaned:
                return ["http://localhost:3000"]

            # Support JSON-style lists stored as env strings
            if cleaned.startswith("[") and cleaned.endswith("]"):
                try:
                    parsed = json.loads(cleaned)
                    if isinstance(parsed, list):
                        return [
                            origin.strip().rstrip("/") for origin in parsed if origin
                        ]
                except json.JSONDecodeError:
                    # Fall through to comma parsing
                    pass

            # Comma separated list fallback
            return [
                item.strip().rstrip("/") for item in cleaned.split(",") if item.strip()
            ]

        if isinstance(v, list):
            return [str(origin).strip().rstrip("/") for origin in v if origin]

        return [str(v).strip().rstrip("/")]

    # Email Configuration
    EMAILS_ENABLED: bool
    EMAILS_FROM_NAME: str
    EMAILS_FROM_EMAIL: EmailStr
    EMAIL_TEMPLATES_DIR: str = "app/email-templates"
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48

    # SMTP Configuration (optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_TLS: Optional[bool] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # MongoDB Configuration
    MONGODB_URI: str
    MONGODB_DB_NAME: str

    # Superuser
    FIRST_SUPERUSER_EMAIL: EmailStr
    FIRST_SUPERUSER_FIRST_NAME: str
    FIRST_SUPERUSER_LAST_NAME: str
    FIRST_SUPERUSER_PASSWORD: str
    USERS_OPEN_REGISTRATION: bool

    # Google Drive
    GDRIVE_RESUMES: str
    GDRIVE_OTHER_FILES: str
    GDRIVE_LESSONS: str

    # Google Drive Service Account Credentials
    GOOGLE_TYPE: str = "service_account"
    GOOGLE_PROJECT_ID: Optional[str] = None
    GOOGLE_PRIVATE_KEY_ID: Optional[str] = None
    GOOGLE_PRIVATE_KEY: Optional[str] = None
    GOOGLE_CLIENT_EMAIL: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_AUTH_URI: str = "https://accounts.google.com/o/oauth2/auth"
    GOOGLE_TOKEN_URI: str = "https://oauth2.googleapis.com/token"
    GOOGLE_AUTH_PROVIDER_X509_CERT_URL: str = (
        "https://www.googleapis.com/oauth2/v1/certs"
    )
    GOOGLE_CLIENT_X509_CERT_URL: Optional[str] = None
    GOOGLE_UNIVERSE_DOMAIN: str = "googleapis.com"

    # Google OAuth 2.0 for User Authentication
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = None
    GOOGLE_OAUTH_CLIENT_SECRET: Optional[str] = None
    GOOGLE_OAUTH_REDIRECT_URI: Optional[str] = None


settings = Settings()
