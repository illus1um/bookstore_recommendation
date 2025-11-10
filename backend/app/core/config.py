"""
Конфигурация приложения.
Использует Pydantic Settings для управления настройками из переменных окружения.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import json


class Settings(BaseSettings):
    """Настройки приложения."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    PROJECT_NAME: str = "Bookstore Recommendation System"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # MongoDB
    MONGODB_URL: str = Field(default="mongodb://localhost:27017")
    DATABASE_NAME: str = Field(default="bookstore_db")
    
    # Security
    SECRET_KEY: str = Field(...)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"]
    )
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        """Преобразует строку или список в список строк для CORS."""
        # Если пришла строка-массив типа: ["http://localhost:3000","http://localhost:5173"]
        if isinstance(v, str) and v.strip().startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(i).strip() for i in parsed]
            except Exception:
                pass
        # Если пришла простая строка с запятыми
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        # Если это уже список
        if isinstance(v, list):
            return [str(i).strip() for i in v]
        raise ValueError(v)


settings = Settings()

