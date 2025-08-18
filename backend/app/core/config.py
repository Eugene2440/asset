from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Firebase
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: Optional[str] = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Application
    PROJECT_NAME: str = "IT Asset Management System"

    class Config:
        env_file = ".env"

settings = Settings()