from typing import Optional, Union

from pydantic import (
    AnyHttpUrl,
    EmailStr,
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

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list]) -> Union[list[str], list]:
        if isinstance(v, str):
            if not v or v.strip() == "":
                # Return default if empty
                return ["http://localhost:3000"]
            if not v.startswith("["):
                # Split by comma and filter out empty strings
                return [i.strip() for i in v.split(",") if i.strip()]
        if isinstance(v, list):
            return v
        return [v]

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
    GOOGLE_AUTH_PROVIDER_X509_CERT_URL: str = "https://www.googleapis.com/oauth2/v1/certs"
    GOOGLE_CLIENT_X509_CERT_URL: Optional[str] = None
    GOOGLE_UNIVERSE_DOMAIN: str = "googleapis.com"


settings = Settings()
