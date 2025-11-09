from typing import Union

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

    # SENTRY_DSN: Optional[HttpUrl] = ""

    # @field_validator("SENTRY_DSN")
    # def sentry_dsn_can_be_blank(cls, v: str) -> Optional[str]:
    #     if len(v) == 0:
    #         return None
    #     return v

    # SMTP_USER: str
    # SMTP_HOST: str
    # SMTP_PORT: str
    # SMTP_TLS: str
    # SMTP_PASSWORD: str
    EMAILS_FROM_NAME: str
    EMAILS_FROM_EMAIL: str

    # MongoDB Configuration
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "te_platform"

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
