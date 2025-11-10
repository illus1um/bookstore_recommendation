"""
API endpoints для аутентификации.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, UserLogin
from app.schemas.token import Token
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Регистрация нового пользователя.
    
    Args:
        user_data: Данные для регистрации
        
    Returns:
        Созданный пользователь
        
    Raises:
        HTTPException: Если email или username уже существуют
    """
    # Проверяем, существует ли пользователь с таким email
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже зарегистрирован"
        )
    
    # Проверяем, существует ли пользователь с таким username
    existing_user = await User.find_one(User.username == user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким username уже зарегистрирован"
        )
    
    # Создаем нового пользователя
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        age=user_data.age,
        favorite_genres=user_data.favorite_genres,
        favorite_authors=user_data.favorite_authors,
        avatar_url=user_data.avatar_url
    )
    
    await user.insert()
    return user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Вход пользователя и получение JWT токена.
    
    Args:
        form_data: Данные формы (username - это email, password)
        
    Returns:
        JWT токен доступа
        
    Raises:
        HTTPException: Если неверные учетные данные
    """
    # Ищем пользователя по email (OAuth2PasswordRequestForm использует username)
    user = await User.find_one(User.email == form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверяем пароль
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Обновляем last_login
    user.last_login = datetime.utcnow()
    await user.save()
    
    # Создаем токен
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Выход пользователя (в текущей реализации просто проверяет токен).
    
    Args:
        current_user: Текущий пользователь
        
    Returns:
        Сообщение об успешном выходе
    """
    # В JWT токенах logout обычно обрабатывается на клиенте
    # Здесь можно добавить логику для blacklist токенов, если нужно
    return {"message": "Успешный выход"}


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Получает информацию о текущем пользователе.
    
    Args:
        current_user: Текущий пользователь
        
    Returns:
        Информация о пользователе
    """
    return current_user

