from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriLink API"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/agrilink"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:19006"]

    class Config:
        env_file = ".env"


settings = Settings()
