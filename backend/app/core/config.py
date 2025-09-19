from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Firebase
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: Optional[str] = None

    # Database
    DATABASE_URL: str

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

    # Application
    PROJECT_NAME: str = "IT Asset Management System"

    # JWT
    SECRET_KEY: str = "your-super-secret-key" # CHANGE THIS IN PRODUCTION
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()