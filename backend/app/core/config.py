from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Small Business Sales Manager"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Database
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite+aiosqlite:///./sales_manager.db"
    
    # Security
    SECRET_KEY: str = "super-secret-sales-manager-key-change-in-prod-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://sales-manager.vercel.app"
    
    # AI Assistance Settings
    AI_API_KEY: str = "demo-mock-key"
    AI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    AI_MODEL: str = "gemini-1.5-flash"
    
    # Seed control
    SEED_DEMO_DATA: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
