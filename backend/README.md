# Backend для Книжного Интернет-Магазина с Системой Рекомендаций

Backend приложение на FastAPI с MongoDB и системой рекомендаций на основе collaborative filtering и content-based filtering.

## 🚀 Технологический стек

- **FastAPI** - современный веб-фреймворк для Python
- **MongoDB** - NoSQL база данных
- **Beanie** - ODM для MongoDB (асинхронный)
- **Motor** - асинхронный драйвер для MongoDB
- **JWT** - аутентификация через токены
- **scikit-learn** - для collaborative filtering рекомендаций
- **Pydantic** - валидация данных

## 📋 Требования

- Python 3.10+
- MongoDB 4.4+
- pip или poetry

## 🔧 Установка

### 1. Установка зависимостей

```bash
# Создайте виртуальное окружение
python -m venv venv

# Активируйте виртуальное окружение
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 2. Настройка MongoDB

#### Вариант 1: Локальная установка MongoDB

1. Скачайте и установите MongoDB с [официального сайта](https://www.mongodb.com/try/download/community)
2. Запустите MongoDB сервис:
   ```bash
   # Windows (если установлен как сервис, запустится автоматически)
   # Или вручную:
   mongod --dbpath C:\data\db
   
   # Linux/Mac:
   sudo systemctl start mongod
   # или
   mongod --dbpath /data/db
   ```

#### Вариант 2: Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Вариант 3: MongoDB Atlas (облачный)

1. Создайте аккаунт на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Создайте кластер
3. Получите connection string

### 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=bookstore_db
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
API_V1_STR=/api/v1
PROJECT_NAME=Bookstore Recommendation System
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
ENVIRONMENT=development
```

**Важно:** Измените `SECRET_KEY` на случайную строку для production!

### 4. Инициализация базы данных

Запустите скрипт для создания индексов и загрузки тестовых данных:

```bash
python -m app.db.init_db
```

Или создайте отдельный скрипт для инициализации:

```python
# init_database.py
import asyncio
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.init_db import init_db

async def main():
    await connect_to_mongo()
    await init_db()
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
```

Запустите:
```bash
python init_database.py
```

## 🏃 Запуск сервера

### Режим разработки

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production режим

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Сервер будет доступен по адресу: `http://localhost:8000`

## 📚 API Документация

После запуска сервера доступна интерактивная документация:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Тестирование API

### 1. Регистрация пользователя

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "password123",
    "full_name": "Test User",
    "favorite_genres": ["Фантастика", "Детектив"],
    "favorite_authors": ["Author Name"]
  }'
```

### 2. Вход и получение токена

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```

Ответ:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### 3. Получение информации о текущем пользователе

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Получение списка книг

```bash
curl -X GET "http://localhost:8000/api/v1/books/?skip=0&limit=10"
```

### 5. Поиск книг

```bash
curl -X GET "http://localhost:8000/api/v1/books/search?q=фантастика"
```

### 6. Создание взаимодействия (просмотр книги)

```bash
curl -X POST "http://localhost:8000/api/v1/interactions/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "BOOK_ID",
    "interaction_type": "view",
    "metadata": {"duration": 120}
  }'
```

### 7. Получение персональных рекомендаций

```bash
curl -X GET "http://localhost:8000/api/v1/recommendations/for-you?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. Получение популярных книг

```bash
curl -X GET "http://localhost:8000/api/v1/recommendations/trending?limit=10"
```

## 📁 Структура проекта

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Главный файл FastAPI приложения
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py            # Dependencies для FastAPI
│   │   └── endpoints/
│   │       ├── auth.py        # Аутентификация
│   │       ├── users.py       # Пользователи
│   │       ├── books.py       # Книги
│   │       ├── interactions.py # Взаимодействия
│   │       └── recommendations.py # Рекомендации
│   ├── core/
│   │   ├── config.py          # Конфигурация
│   │   └── security.py        # Безопасность (JWT, пароли)
│   ├── db/
│   │   ├── mongodb.py         # Подключение к MongoDB
│   │   └── init_db.py         # Инициализация БД
│   ├── models/
│   │   ├── user.py            # Модель пользователя
│   │   ├── book.py            # Модель книги
│   │   └── interaction.py     # Модель взаимодействия
│   ├── schemas/
│   │   ├── user.py            # Схемы пользователя
│   │   ├── book.py            # Схемы книги
│   │   ├── interaction.py    # Схемы взаимодействия
│   │   └── token.py           # Схемы токенов
│   └── services/
│       ├── recommendation_engine.py      # Движок рекомендаций
│       └── collaborative_filtering.py    # Collaborative filtering
├── tests/
│   └── __init__.py
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## 🔐 Аутентификация

API использует JWT токены для аутентификации. Большинство endpoints требуют авторизации.

Для доступа к защищенным endpoints добавьте заголовок:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🎯 Основные Endpoints

### Аутентификация (`/api/v1/auth`)
- `POST /register` - Регистрация
- `POST /login` - Вход
- `POST /logout` - Выход
- `GET /me` - Текущий пользователь

### Пользователи (`/api/v1/users`)
- `GET /{user_id}` - Профиль пользователя
- `PUT /{user_id}` - Обновить профиль
- `GET /{user_id}/history` - История взаимодействий
- `PUT /{user_id}/preferences` - Обновить предпочтения

### Книги (`/api/v1/books`)
- `GET /` - Список книг (с фильтрами)
- `GET /{book_id}` - Детали книги
- `POST /` - Создать книгу (admin)
- `PUT /{book_id}` - Обновить книгу (admin)
- `DELETE /{book_id}` - Удалить книгу (admin)
- `GET /search` - Поиск книг

### Взаимодействия (`/api/v1/interactions`)
- `POST /` - Создать взаимодействие
- `GET /user/{user_id}` - Взаимодействия пользователя

### Рекомендации (`/api/v1/recommendations`)
- `GET /for-you` - Персональные рекомендации
- `GET /similar/{book_id}` - Похожие книги
- `GET /trending` - Популярные книги
- `GET /by-genre/{genre}` - Рекомендации по жанру

## 🤖 Система рекомендаций

Система использует три метода:

1. **Content-based filtering** - на основе жанров и авторов, которые нравятся пользователю
2. **Collaborative filtering** - находит похожих пользователей и рекомендует их книги
3. **Popularity-based** - для новых пользователей или когда других методов недостаточно

## 🐛 Отладка

### Проверка подключения к MongoDB

```python
from app.db.mongodb import connect_to_mongo
import asyncio

async def test():
    await connect_to_mongo()
    print("Подключение успешно!")

asyncio.run(test())
```

### Логирование

FastAPI автоматически логирует запросы. Для более детального логирования настройте logging в `main.py`.

## 📝 Примечания

- Для production обязательно измените `SECRET_KEY` на безопасный случайный ключ
- Настройте CORS origins для вашего frontend
- Рекомендуется использовать переменные окружения для всех настроек
- Для production используйте несколько workers: `--workers 4`

## 🚧 TODO

- [ ] Добавить rate limiting
- [ ] Добавить кэширование рекомендаций
- [ ] Улучшить поиск (Elasticsearch/Atlas Search)
- [ ] Добавить email верификацию
- [ ] Добавить восстановление пароля
- [ ] Добавить unit и integration тесты
- [ ] Добавить логирование
- [ ] Оптимизировать запросы к БД

## 📄 Лицензия

MIT

