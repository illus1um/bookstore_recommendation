"""
Модуль для подключения к MongoDB.
Использует Motor для асинхронной работы и Beanie для ODM.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.book import Book
from app.models.interaction import Interaction
from app.models.cart import Cart
from app.models.order import Order


class MongoDB:
    """Класс для управления подключением к MongoDB."""
    
    client: AsyncIOMotorClient = None
    database = None


mongodb = MongoDB()


async def connect_to_mongo():
    """
    Подключается к MongoDB и инициализирует Beanie.
    """
    mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
    mongodb.database = mongodb.client[settings.DATABASE_NAME]
    
    # Инициализация Beanie с моделями
    await init_beanie(
        database=mongodb.database,
        document_models=[User, Book, Interaction, Cart, Order]
    )
    print(f"✅ Подключено к MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    """
    Закрывает подключение к MongoDB.
    """
    if mongodb.client:
        mongodb.client.close()
        print("✅ Подключение к MongoDB закрыто")

