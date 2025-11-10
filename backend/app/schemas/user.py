"""
Схемы для работы с пользователями.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Базовая схема пользователя."""
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    favorite_genres: List[str] = Field(default_factory=list)
    favorite_authors: List[str] = Field(default_factory=list)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Схема для создания пользователя."""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    """Схема для обновления пользователя."""
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    favorite_genres: Optional[List[str]] = None
    favorite_authors: Optional[List[str]] = None
    avatar_url: Optional[str] = None


class UserPreferences(BaseModel):
    """Схема для обновления предпочтений пользователя."""
    favorite_genres: List[str] = Field(default_factory=list)
    favorite_authors: List[str] = Field(default_factory=list)


class UserInDB(UserBase):
    """Схема пользователя в БД."""
    id: str
    is_admin: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, value):
        return str(value)


class User(UserInDB):
    """Схема пользователя для ответа API."""
    pass


class UserLogin(BaseModel):
    """Схема для входа пользователя."""
    email: EmailStr
    password: str

