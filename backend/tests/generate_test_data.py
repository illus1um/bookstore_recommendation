"""
Скрипт для генерации больших объемов тестовых данных для тестирования производительности.
"""
import asyncio
import random
from datetime import datetime, timedelta
from typing import List

from faker import Faker
from beanie import PydanticObjectId

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.models.user import User
from app.models.book import Book
from app.models.interaction import Interaction, InteractionType

fake = Faker(['ru_RU'])


# Списки для генерации реалистичных данных
GENRES = [
    "Фантастика", "Детектив", "Роман", "Триллер", "Фэнтези",
    "Научная фантастика", "Приключения", "Историческая литература",
    "Биография", "Психология", "Философия", "Бизнес", "Саморазвитие",
    "Ужасы", "Мистика", "Драма", "Комедия", "Поэзия"
]

LANGUAGES = ["Русский", "English", "Español", "Français", "Deutsch", "中文"]

AUTHORS = [
    "Лев Толстой", "Федор Достоевский", "Александр Пушкин",
    "Антон Чехов", "Михаил Булгаков", "Иван Тургенев",
    "Николай Гоголь", "Владимир Набоков", "Борис Пастернак",
    "Айзек Азимов", "Рэй Брэдбери", "Стивен Кинг",
    "Джордж Оруэлл", "Дж. Р. Р. Толкин", "Агата Кристи",
    "Артур Конан Дойл", "Эрнест Хемингуэй", "Франц Кафка"
]

TAGS = [
    "бестселлер", "классика", "новинка", "экранизация", 
    "премия", "популярное", "рекомендуем", "шедевр",
    "легкое чтение", "глубокий смысл", "захватывающий сюжет",
    "психологизм", "философское", "для души", "для размышлений"
]


async def generate_users(count: int) -> List[User]:
    """Генерирует пользователей."""
    print(f"📝 Генерация {count} пользователей...")
    users = []
    
    for i in range(count):
        user = User(
            email=f"testuser{i}@example.com",
            username=f"user_{i}",
            full_name=fake.name(),
            hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYTNhYx0tI2",  # password123
            is_active=True,
            is_superuser=False,
            favorite_genres=random.sample(GENRES, k=random.randint(1, 4)),
            favorite_authors=random.sample(AUTHORS, k=random.randint(0, 3))
        )
        users.append(user)
        
        if (i + 1) % 100 == 0:
            print(f"  ✓ Создано {i + 1} пользователей...")
    
    # Массовая вставка
    await User.insert_many(users)
    print(f"✅ {count} пользователей созданы")
    return users


async def generate_books(count: int) -> List[Book]:
    """Генерирует книги."""
    print(f"📚 Генерация {count} книг...")
    books = []
    
    for i in range(count):
        genre = random.choice(GENRES)
        author = random.choice(AUTHORS)
        
        book = Book(
            title=f"{fake.catch_phrase()} - {fake.word().title()}",
            author=author,
            description=fake.text(max_nb_chars=300),
            genre=genre,
            price=round(random.uniform(199, 2999), 2),
            stock=random.randint(0, 500),
            isbn=fake.isbn13(),
            publisher=fake.company(),
            publication_year=random.randint(1950, 2024),
            pages=random.randint(100, 1200),
            language=random.choice(LANGUAGES),
            cover_image=f"https://picsum.photos/seed/{i}/400/600",
            average_rating=round(random.uniform(3.0, 5.0), 2),
            ratings_count=random.randint(0, 5000),
            tags=random.sample(TAGS, k=random.randint(2, 6)),
            is_featured=random.random() < 0.1,
            discount_percentage=random.choice([0, 0, 0, 5, 10, 15, 20, 25])
        )
        books.append(book)
        
        if (i + 1) % 100 == 0:
            print(f"  ✓ Создано {i + 1} книг...")
    
    # Массовая вставка
    await Book.insert_many(books)
    print(f"✅ {count} книг создано")
    return books


async def generate_interactions(
    users: List[User], 
    books: List[Book], 
    interactions_per_user: int = 50
) -> None:
    """Генерирует взаимодействия пользователей с книгами."""
    total = len(users) * interactions_per_user
    print(f"🔄 Генерация ~{total} взаимодействий...")
    
    interaction_types = list(InteractionType)
    batch_size = 1000
    interactions_batch = []
    created_count = 0
    
    for user_idx, user in enumerate(users):
        # Каждый пользователь взаимодействует с случайными книгами
        user_books = random.sample(books, k=min(interactions_per_user, len(books)))
        
        for book in user_books:
            interaction_type = random.choice(interaction_types)
            
            # Генерируем метаданные в зависимости от типа
            metadata = {}
            if interaction_type == InteractionType.VIEW:
                metadata = {"duration": random.randint(10, 600)}
            elif interaction_type == InteractionType.PURCHASE:
                metadata = {
                    "quantity": random.randint(1, 3),
                    "price_at_purchase": book.price
                }
            elif interaction_type == InteractionType.REVIEW:
                metadata = {
                    "rating": random.randint(1, 5),
                    "review_text": fake.sentence()
                }
            elif interaction_type == InteractionType.ADD_TO_CART:
                metadata = {"quantity": random.randint(1, 5)}
            
            # Случайная дата за последние 90 дней
            timestamp = datetime.utcnow() - timedelta(
                days=random.randint(0, 90),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            interaction = Interaction(
                user_id=user.id,
                book_id=book.id,
                interaction_type=interaction_type,
                timestamp=timestamp,
                metadata=metadata
            )
            interactions_batch.append(interaction)
            created_count += 1
            
            # Вставляем батчами для оптимизации
            if len(interactions_batch) >= batch_size:
                await Interaction.insert_many(interactions_batch)
                interactions_batch = []
                print(f"  ✓ Создано {created_count} взаимодействий...")
        
        if (user_idx + 1) % 10 == 0:
            print(f"  ✓ Обработано {user_idx + 1}/{len(users)} пользователей...")
    
    # Вставляем оставшиеся
    if interactions_batch:
        await Interaction.insert_many(interactions_batch)
    
    print(f"✅ {created_count} взаимодействий создано")


async def clear_test_data():
    """Очищает тестовые данные."""
    print("🧹 Очистка существующих тестовых данных...")
    
    # Удаляем только тестовых пользователей
    deleted_users = await User.find({"email": {"$regex": "^testuser.*@example.com$"}}).delete()
    print(f"  ✓ Удалено {deleted_users.deleted_count} тестовых пользователей")
    
    # Можно также очистить все данные (раскомментировать при необходимости)
    # await User.delete_all()
    # await Book.delete_all()
    # await Interaction.delete_all()
    # print("  ✓ Все данные удалены")


async def main():
    """Основная функция."""
    print("=" * 60)
    print("🚀 ГЕНЕРАЦИЯ ТЕСТОВЫХ ДАННЫХ ДЛЯ ТЕСТИРОВАНИЯ ПРОИЗВОДИТЕЛЬНОСТИ")
    print("=" * 60)
    
    await connect_to_mongo()
    
    try:
        # Параметры генерации (можно изменить)
        NUM_USERS = 1000
        NUM_BOOKS = 5000
        INTERACTIONS_PER_USER = 50
        
        print(f"\n📊 Параметры генерации:")
        print(f"  - Пользователей: {NUM_USERS}")
        print(f"  - Книг: {NUM_BOOKS}")
        print(f"  - Взаимодействий на пользователя: {INTERACTIONS_PER_USER}")
        print(f"  - Всего взаимодействий: ~{NUM_USERS * INTERACTIONS_PER_USER}")
        print()
        
        # Очистка старых тестовых данных
        await clear_test_data()
        print()
        
        # Генерация
        start_time = datetime.now()
        
        users = await generate_users(NUM_USERS)
        books = await generate_books(NUM_BOOKS)
        await generate_interactions(users, books, INTERACTIONS_PER_USER)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print()
        print("=" * 60)
        print(f"✅ ГЕНЕРАЦИЯ ЗАВЕРШЕНА ЗА {duration:.2f} СЕКУНД")
        print("=" * 60)
        print(f"\n📈 Статистика:")
        print(f"  - Создано пользователей: {len(users)}")
        print(f"  - Создано книг: {len(books)}")
        print(f"  - Создано взаимодействий: ~{len(users) * INTERACTIONS_PER_USER}")
        print(f"  - Производительность: ~{(len(users) + len(books)) / duration:.0f} записей/сек")
        print()
        
    finally:
        await close_mongo_connection()
        print("🔌 Соединение с БД закрыто")


if __name__ == "__main__":
    asyncio.run(main())

