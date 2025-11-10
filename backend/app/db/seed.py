"""
Seed-скрипт для наполнения базы данных тестовыми данными.
Запуск: python app/db/seed.py
"""
import asyncio
import random
from datetime import datetime, timedelta

from faker import Faker

from app.core.security import get_password_hash
from app.db.init_db import create_indexes
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.models.book import Book
from app.models.cart import Cart
from app.models.interaction import Interaction, InteractionType
from app.models.order import Order, OrderItem, OrderStatus, ShippingAddress
from app.models.user import User

fake = Faker()

GENRES = [
    "Fiction",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Romance",
    "Non-Fiction",
    "Biography",
    "History",
    "Self-Help",
    "Poetry",
]

TAGS = [
    "bestseller",
    "new",
    "classic",
    "award-winning",
    "young-adult",
    "thriller",
    "inspirational",
    "educational",
    "series",
    "short-stories",
]


async def wipe_collections():
    """Очищает коллекции перед наполнением."""

    await User.get_motor_collection().delete_many({})
    await Book.get_motor_collection().delete_many({})
    await Interaction.get_motor_collection().delete_many({})
    await Order.get_motor_collection().delete_many({})
    await Cart.get_motor_collection().delete_many({})


def generate_users(count: int) -> list[User]:
    users: list[User] = []
    for _ in range(count):
        favorite_genres = random.sample(GENRES, k=random.randint(2, 4))
        favorite_authors = [fake.name() for _ in range(random.randint(1, 3))]
        user = User(
            email=fake.unique.email(),
            username=fake.unique.user_name(),
            hashed_password=get_password_hash("password123"),
            full_name=fake.name(),
            age=random.randint(18, 70),
            favorite_genres=favorite_genres,
            favorite_authors=favorite_authors,
            avatar_url=f"https://i.pravatar.cc/150?u={fake.uuid4()}",
            created_at=datetime.utcnow() - timedelta(days=random.randint(10, 365)),
            last_login=datetime.utcnow() - timedelta(hours=random.randint(1, 240)),
        )
        users.append(user)
    return users


def generate_books(count: int) -> list[Book]:
    books: list[Book] = []
    for _ in range(count):
        genre = random.choice(GENRES)
        title = fake.sentence(nb_words=random.randint(2, 4)).rstrip(".")
        author = fake.name()
        book = Book(
            title=title,
            author=author,
            isbn=fake.unique.isbn13(separator="") if random.random() > 0.3 else None,
            description=fake.text(max_nb_chars=600),
            genre=genre,
            publisher=fake.company(),
            publication_year=random.randint(2010, 2024),
            page_count=random.randint(180, 650),
            language=random.choice(["en", "ru", "de", "fr"]),
            cover_image_url=f"https://picsum.photos/seed/{fake.uuid4()}/320/480",
            price=round(random.uniform(5.99, 49.99), 2),
            stock=random.randint(5, 60),
            average_rating=round(random.uniform(3.5, 5.0), 2),
            tags=random.sample(TAGS, k=random.randint(1, 4)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 120)),
        )
        books.append(book)
    return books


async def generate_interactions(users: list[User], books: list[Book], count: int):
    interactions: list[Interaction] = []
    book_map = {book.id: book for book in books}

    for _ in range(count):
        user = random.choice(users)
        book = random.choice(books)
        interaction_type = random.choices(
            population=[
                InteractionType.VIEW,
                InteractionType.LIKE,
                InteractionType.ADD_TO_CART,
                InteractionType.PURCHASE,
                InteractionType.REVIEW,
            ],
            weights=[0.4, 0.2, 0.15, 0.15, 0.1],
            k=1,
        )[0]

        metadata: dict = {}
        if interaction_type == InteractionType.VIEW:
            metadata["duration"] = random.randint(15, 600)
        elif interaction_type == InteractionType.ADD_TO_CART:
            metadata["quantity"] = random.randint(1, 3)
        elif interaction_type == InteractionType.PURCHASE:
            quantity = random.randint(1, 3)
            metadata["quantity"] = quantity
            metadata["price_at_purchase"] = book.price
        elif interaction_type == InteractionType.REVIEW:
            rating = random.randint(1, 5)
            metadata["rating"] = rating
            metadata["review_text"] = fake.text(max_nb_chars=140)

        interaction = Interaction(
            user_id=user.id,
            book_id=book.id,
            interaction_type=interaction_type,
            timestamp=datetime.utcnow()
            - timedelta(days=random.randint(0, 90), hours=random.randint(0, 23)),
            metadata=metadata,
        )
        interactions.append(interaction)

    await Interaction.insert_many(interactions)


async def generate_orders(users: list[User], books: list[Book], max_orders_per_user: int = 3):
    orders: list[Order] = []
    book_map = {book.id: book for book in books}

    for user in users:
        order_count = random.randint(0, max_orders_per_user)
        for _ in range(order_count):
            order_items: list[OrderItem] = []
            selected_books = random.sample(books, k=random.randint(1, 4))
            total_amount = 0.0

            for book in selected_books:
                quantity = random.randint(1, 3)
                total_amount += book.price * quantity
                order_items.append(
                    OrderItem(
                        book_id=book.id,
                        quantity=quantity,
                        price_at_purchase=book.price,
                        title=book.title,
                        author=book.author,
                    )
                )
                book.stock = max(book.stock - quantity, 0)

            created_at = datetime.utcnow() - timedelta(days=random.randint(0, 120))
            order = Order(
                user_id=user.id,
                items=order_items,
                total_amount=round(total_amount, 2),
                status=random.choice(list(OrderStatus)),
                shipping_address=ShippingAddress(
                    address=fake.street_address(),
                    city=fake.city(),
                    postal_code=fake.postcode(),
                    country=fake.country(),
                ),
                created_at=created_at,
                updated_at=created_at,
            )
            orders.append(order)

    if orders:
        await Order.insert_many(orders)
        for book in books:
            await book.save()


async def seed():
    await connect_to_mongo()
    await create_indexes()
    await wipe_collections()

    user_count = random.randint(12, 18)
    book_count = random.randint(70, 90)
    interaction_count = random.randint(250, 450)

    users = generate_users(user_count)
    books = generate_books(book_count)

    await User.insert_many(users)
    await Book.insert_many(books)

    await generate_interactions(users, books, interaction_count)
    await generate_orders(users, books)

    print(
        f"🎉 Seed завершён: users={user_count}, books={book_count}, interactions={interaction_count}"
    )
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(seed())

