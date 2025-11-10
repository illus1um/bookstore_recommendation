"""
Схемы для работы с токенами.
"""
from pydantic import BaseModel


class Token(BaseModel):
    """Схема токена доступа."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Данные из токена."""
    email: str | None = None

