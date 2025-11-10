"""
Скрипт для инициализации базы данных.
Создает индексы и загружает тестовые данные.
"""
from datetime import datetime, timedelta
from faker import Faker
from app.models.user import User
from app.models.book import Book
from app.models.interaction import Interaction, InteractionType
from app.core.security import get_password_hash
import random

fake = Faker("ru_RU")


async def create_indexes():
    """
    Создает индексы для оптимизации запросов.
    """
    # Индексы для User
    await User.get_motor_collection().create_index("email", unique=True)
    await User.get_motor_collection().create_index("username", unique=True)
    
    # Индексы для Book
    await Book.get_motor_collection().create_index("title")
    await Book.get_motor_collection().create_index("author")
    await Book.get_motor_collection().create_index("genre")
    await Book.get_motor_collection().create_index("isbn", unique=True, sparse=True)
    
    # Индексы для Interaction
    await Interaction.get_motor_collection().create_index("user_id")
    await Interaction.get_motor_collection().create_index("book_id")
    await Interaction.get_motor_collection().create_index("timestamp")
    await Interaction.get_motor_collection().create_index([("user_id", 1), ("book_id", 1)])
    
    print("✅ Индексы созданы")


async def init_db():
    """
    Инициализирует базу данных: создает индексы и загружает тестовые данные.
    """
    # Создаем индексы
    await create_indexes()
    
    # Проверяем, есть ли уже данные
    user_count = await User.count()
    if user_count > 0:
        print("⚠️  База данных уже содержит данные. Пропускаем загрузку тестовых данных.")
        return
    
    # Генерация жанров
    genres = [
        "Фантастика", "Детектив", "Роман", "Триллер", "Фэнтези",
        "Научная литература", "Биография", "История", "Поэзия", "Драма"
    ]
    
    # Генерация авторов
    authors = [fake.name() for _ in range(15)]
    
    # Создаем пользователей
    users = []
    for i in range(10):
        user = User(
            email=fake.unique.email(),
            username=fake.unique.user_name(),
            hashed_password=get_password_hash("password123"),
            full_name=fake.name(),
            age=random.randint(18, 70),
            favorite_genres=random.sample(genres, k=random.randint(2, 5)),
            favorite_authors=random.sample(authors, k=random.randint(1, 3)),
            avatar_url=f"https://i.pravatar.cc/150?img={i+1}",
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 365)),
            last_login=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
        )
        users.append(user)
    
    await User.insert_many(users)
    print(f"✅ Создано {len(users)} пользователей")
    
    # Создаем книги
    books = []
    for i in range(20):
        book = Book(
            title=fake.sentence(nb_words=3).rstrip('.'),
            author=random.choice(authors),
            isbn=fake.isbn13() if random.random() > 0.2 else None,
            description=fake.text(max_nb_chars=500),
            genre=random.choice(genres),
            publisher=fake.company(),
            publication_year=random.randint(1990, 2024),
            page_count=random.randint(200, 800),
            language=random.choice(["ru", "en"]),
            cover_image_url=f"https://picsum.photos/300/400?random={i}",
            price=round(random.uniform(299, 2999), 2),
            stock=random.randint(0, 50),
            average_rating=round(random.uniform(3.0, 5.0), 1),
            tags=random.sample(["бестселлер", "новинка", "классика", "популярное"], k=random.randint(1, 3)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 180))
        )
        books.append(book)
    
    await Book.insert_many(books)
    print(f"✅ Создано {len(books)} книг")
    
    # Создаем взаимодействия
    interactions = []
    interaction_types = list(InteractionType)
    
    for user in users:
        # Каждый пользователь взаимодействует с 5-15 книгами
        user_books = random.sample(books, k=random.randint(5, 15))
        
        for book in user_books:
            # Случайный тип взаимодействия
            interaction_type = random.choice(interaction_types)
            
            metadata = {}
            if interaction_type == InteractionType.REVIEW:
                metadata["rating"] = random.randint(1, 5)
            elif interaction_type == InteractionType.PURCHASE:
                metadata["quantity"] = random.randint(1, 3)
            elif interaction_type == InteractionType.VIEW:
                metadata["duration"] = random.randint(10, 300)  # секунды
            
            interaction = Interaction(
                user_id=user.id,
                book_id=book.id,
                interaction_type=interaction_type,
                timestamp=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                metadata=metadata
            )
            interactions.append(interaction)
    
    await Interaction.insert_many(interactions)
    print(f"✅ Создано {len(interactions)} взаимодействий")
    
    print("\n🎉 База данных успешно инициализирована!")
    print(f"   Пользователей: {len(users)}")
    print(f"   Книг: {len(books)}")
    print(f"   Взаимодействий: {len(interactions)}")

