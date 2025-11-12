from typing import Optional, Union

from pydantic import (
    AnyHttpUrl,
    EmailStr,
    field_validator,
    ValidationError,
)
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_STR: str
    PROJECT_NAME: str
    SERVER_HOST: str
    DOMAIN: str

    SECRET_KEY: str
    AUTHJWT_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    BACKEND_CORS_ORIGINS: list[AnyHttpUrl] = [
        "http://localhost:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> Union[list[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v

    # Email Configuration
    EMAILS_ENABLED: bool = False
    EMAILS_FROM_NAME: str
    EMAILS_FROM_EMAIL: str
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

    class Config:
        env_file = ".env"
        case_sensitive = True


try:
    settings = Settings()
except ValidationError as err:
    print(err.json(indent=4))
