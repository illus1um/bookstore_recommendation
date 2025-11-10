"""
Модель пользователя.
"""
from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import EmailStr, Field


class User(Document):
    """
    Модель пользователя.
    """
    email: Indexed(EmailStr, unique=True)
    username: Indexed(str, unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    favorite_genres: List[str] = Field(default_factory=list)
    favorite_authors: List[str] = Field(default_factory=list)
    avatar_url: Optional[str] = None
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Settings:
        name = "users"
        indexes = [
            [("email", 1)],
            [("username", 1)],
        ]

