"""
Скрипт для инициализации базы данных.
Создает индексы и загружает тестовые данные.
"""
import asyncio
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.init_db import init_db


async def main():
    """Основная функция для инициализации БД."""
    print("🔄 Подключение к MongoDB...")
    await connect_to_mongo()
    print("🔄 Инициализация базы данных...")
    await init_db()
    print("🔄 Закрытие подключения...")
    await close_mongo_connection()
    print("✅ Готово!")


if __name__ == "__main__":
    asyncio.run(main())

