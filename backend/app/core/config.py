from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriLink API"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/agrilink"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:19006"]

    EE_SERVICE_ACCOUNT_EMAIL: str = ""
    EE_PRIVATE_KEY_PATH: str = ""
    EE_GCP_PROJECT_ID: str = ""

    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"
    PAYPAL_USD_EXCHANGE_RATE: float = 1200.0

    GOOGLE_CLIENT_ID_WEB: str = ""
    GOOGLE_CLIENT_ID_ANDROID: str = ""
    GOOGLE_CLIENT_ID_IOS: str = ""

    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "no-reply@agrilink.ao"
    SMTP_USE_TLS: bool = True

    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 48
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
