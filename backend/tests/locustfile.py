"""
Нагрузочное тестирование API с помощью Locust.

Запуск:
    locust -f tests/locustfile.py --host=http://localhost:8000

Или в headless режиме:
    locust -f tests/locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10 --run-time 60s --headless
"""
import random
from locust import HttpUser, task, between, events
import json


class BookstoreUser(HttpUser):
    """Симуляция поведения пользователя книжного магазина."""
    
    # Время ожидания между запросами (от 1 до 5 секунд)
    wait_time = between(1, 5)
    
    def on_start(self):
        """Выполняется при старте каждого пользователя."""
        self.token = None
        self.user_id = None
        self.book_ids = []
        
        # Регистрация и вход
        self.register_and_login()
        
        # Загрузка списка книг для дальнейших тестов
        self.load_book_ids()
    
    def register_and_login(self):
        """Регистрация и вход пользователя."""
        # Генерируем уникальный email
        random_num = random.randint(100000, 999999)
        email = f"loadtest_{random_num}@example.com"
        password = "testpass123"
        
        # Регистрация
        register_data = {
            "email": email,
            "username": f"loaduser_{random_num}",
            "password": password,
            "full_name": f"Load Test User {random_num}",
            "favorite_genres": ["Фантастика", "Детектив"],
            "favorite_authors": []
        }
        
        with self.client.post(
            "/api/v1/auth/register",
            json=register_data,
            catch_response=True,
            name="/api/v1/auth/register"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                # Если пользователь уже существует, это нормально для тестов
                response.success()
        
        # Вход
        login_data = {
            "username": email,
            "password": password
        }
        
        with self.client.post(
            "/api/v1/auth/login",
            data=login_data,
            catch_response=True,
            name="/api/v1/auth/login"
        ) as response:
            if response.status_code == 200:
                result = response.json()
                self.token = result.get("access_token")
                response.success()
            else:
                response.failure(f"Login failed: {response.text}")
    
    def load_book_ids(self):
        """Загружает ID книг для дальнейшего использования."""
        with self.client.get(
            "/api/v1/books/?skip=0&limit=50",
            catch_response=True,
            name="/api/v1/books (initial)"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                # Проверяем разные форматы ответа
                if isinstance(data, list):
                    books = data
                elif isinstance(data, dict):
                    books = data.get("items", data.get("results", []))
                else:
                    books = []
                
                self.book_ids = [book.get("id") or book.get("_id") for book in books if book.get("id") or book.get("_id")]
                response.success()
    
    @property
    def auth_headers(self):
        """Возвращает заголовки авторизации."""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(10)
    def browse_catalog(self):
        """Просмотр каталога книг (самая частая операция)."""
        skip = random.randint(0, 100)
        limit = random.choice([10, 20, 50])
        
        self.client.get(
            f"/api/v1/books/?skip={skip}&limit={limit}",
            name="/api/v1/books/?skip=[skip]&limit=[limit]"
        )
    
    @task(8)
    def search_books(self):
        """Поиск книг."""
        search_terms = ["фантастика", "детектив", "роман", "приключения", "психология"]
        query = random.choice(search_terms)
        
        self.client.get(
            f"/api/v1/books/search?q={query}",
            name="/api/v1/books/search?q=[query]"
        )
    
    @task(7)
    def view_book_details(self):
        """Просмотр деталей книги."""
        if not self.book_ids:
            return
        
        book_id = random.choice(self.book_ids)
        self.client.get(
            f"/api/v1/books/{book_id}",
            name="/api/v1/books/[id]"
        )
    
    @task(5)
    def get_recommendations(self):
        """Получение персональных рекомендаций."""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/recommendations/for-you?limit=10",
            headers=self.auth_headers,
            name="/api/v1/recommendations/for-you"
        )
    
    @task(5)
    def get_trending(self):
        """Получение популярных книг."""
        self.client.get(
            "/api/v1/recommendations/trending?limit=10",
            name="/api/v1/recommendations/trending"
        )
    
    @task(4)
    def get_similar_books(self):
        """Получение похожих книг."""
        if not self.book_ids:
            return
        
        book_id = random.choice(self.book_ids)
        self.client.get(
            f"/api/v1/recommendations/similar/{book_id}?limit=10",
            name="/api/v1/recommendations/similar/[id]"
        )
    
    @task(3)
    def create_interaction(self):
        """Создание взаимодействия с книгой."""
        if not self.token or not self.book_ids:
            return
        
        book_id = random.choice(self.book_ids)
        interaction_types = ["view", "like"]
        interaction_type = random.choice(interaction_types)
        
        interaction_data = {
            "book_id": book_id,
            "interaction_type": interaction_type,
            "metadata": {}
        }
        
        if interaction_type == "view":
            interaction_data["metadata"]["duration"] = random.randint(10, 300)
        
        self.client.post(
            "/api/v1/interactions/",
            json=interaction_data,
            headers=self.auth_headers,
            name="/api/v1/interactions/"
        )
    
    @task(2)
    def add_to_cart(self):
        """Добавление книги в корзину."""
        if not self.token or not self.book_ids:
            return
        
        book_id = random.choice(self.book_ids)
        cart_data = {
            "book_id": book_id,
            "quantity": random.randint(1, 3)
        }
        
        self.client.post(
            "/api/v1/cart/add",
            json=cart_data,
            headers=self.auth_headers,
            name="/api/v1/cart/add"
        )
    
    @task(2)
    def get_cart(self):
        """Просмотр корзины."""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/cart/",
            headers=self.auth_headers,
            name="/api/v1/cart/"
        )
    
    @task(1)
    def get_user_profile(self):
        """Получение профиля пользователя."""
        if not self.token:
            return
        
        self.client.get(
            "/api/v1/auth/me",
            headers=self.auth_headers,
            name="/api/v1/auth/me"
        )
    
    @task(1)
    def filter_by_genre(self):
        """Фильтрация книг по жанру."""
        genres = ["Фантастика", "Детектив", "Роман", "Триллер", "Фэнтези"]
        genre = random.choice(genres)
        
        self.client.get(
            f"/api/v1/books/?genre={genre}&limit=20",
            name="/api/v1/books/?genre=[genre]"
        )


class RecommendationFocusedUser(HttpUser):
    """
    Пользователь, фокусирующийся на тестировании системы рекомендаций.
    Это позволяет отдельно тестировать производительность рекомендательной системы.
    """
    
    wait_time = between(2, 4)
    weight = 1  # Меньший вес по сравнению с обычными пользователями
    
    def on_start(self):
        """Выполняется при старте."""
        self.token = None
        self.book_ids = []
        
        # Используем существующего пользователя для тестов
        self.login_existing_user()
        self.load_book_ids()
    
    def login_existing_user(self):
        """Вход под существующим пользователем."""
        # Пробуем войти под тестовым пользователем
        login_data = {
            "username": "testuser0@example.com",
            "password": "password123"
        }
        
        with self.client.post(
            "/api/v1/auth/login",
            data=login_data,
            catch_response=True,
            name="/api/v1/auth/login (existing)"
        ) as response:
            if response.status_code == 200:
                result = response.json()
                self.token = result.get("access_token")
                response.success()
    
    def load_book_ids(self):
        """Загружает ID книг."""
        with self.client.get("/api/v1/books/?skip=0&limit=50") as response:
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    books = data
                else:
                    books = data.get("items", data.get("results", []))
                self.book_ids = [book.get("id") or book.get("_id") for book in books]
    
    @property
    def auth_headers(self):
        """Возвращает заголовки авторизации."""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(10)
    def get_personal_recommendations(self):
        """Получение персональных рекомендаций (collaborative filtering)."""
        if not self.token:
            return
        
        limits = [5, 10, 20]
        limit = random.choice(limits)
        
        self.client.get(
            f"/api/v1/recommendations/for-you?limit={limit}",
            headers=self.auth_headers,
            name="/api/v1/recommendations/for-you?limit=[limit]"
        )
    
    @task(8)
    def get_similar_books(self):
        """Получение похожих книг (content-based)."""
        if not self.book_ids:
            return
        
        book_id = random.choice(self.book_ids)
        limits = [5, 10, 20]
        limit = random.choice(limits)
        
        self.client.get(
            f"/api/v1/recommendations/similar/{book_id}?limit={limit}",
            name="/api/v1/recommendations/similar/[id]?limit=[limit]"
        )
    
    @task(5)
    def get_trending_books(self):
        """Получение трендовых книг."""
        limits = [10, 20, 50]
        limit = random.choice(limits)
        
        self.client.get(
            f"/api/v1/recommendations/trending?limit={limit}",
            name="/api/v1/recommendations/trending?limit=[limit]"
        )
    
    @task(3)
    def get_new_books(self):
        """Получение новинок."""
        self.client.get(
            "/api/v1/recommendations/new?limit=10",
            name="/api/v1/recommendations/new"
        )


# Обработчики событий для сбора статистики
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Вызывается при старте теста."""
    print("\n" + "="*60)
    print("🚀 НАЧАЛО НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ")
    print("="*60 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Вызывается при остановке теста."""
    print("\n" + "="*60)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("="*60 + "\n")

