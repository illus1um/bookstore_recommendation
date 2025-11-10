"""
Движок рекомендаций, объединяющий различные методы.
"""
from typing import List, Optional
from datetime import datetime, timedelta
from app.models.book import Book
from app.models.user import User
from app.models.interaction import Interaction, InteractionType
from app.services.collaborative_filtering import CollaborativeFiltering


class RecommendationEngine:
    """
    Движок рекомендаций, использующий несколько методов:
    - Content-based filtering (на основе жанров и авторов)
    - Collaborative filtering (на основе похожих пользователей)
    - Popularity-based (для новых пользователей)
    """
    
    def __init__(self):
        """Инициализация движка рекомендаций."""
        self.collaborative_filtering = CollaborativeFiltering()
    
    async def get_personal_recommendations(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Book]:
        """
        Получает персональные рекомендации для пользователя.
        
        Args:
            user_id: ID пользователя
            limit: Количество рекомендаций
            
        Returns:
            Список рекомендованных книг
        """
        user = await User.get(user_id)
        if not user:
            return []
        
        # Получаем книги, с которыми пользователь уже взаимодействовал
        user_interactions = await Interaction.find(
            Interaction.user_id == user_id
        ).to_list()
        user_interacted_book_ids = {str(i.book_id) for i in user_interactions}
        
        # Если у пользователя мало взаимодействий, используем popularity-based
        if len(user_interactions) < 3:
            return await self.get_trending_books(limit=limit)
        
        # Пробуем collaborative filtering
        recommended_book_ids = await self.collaborative_filtering.recommend_books_for_user(
            user_id=user_id,
            limit=limit * 2  # Берем больше, чтобы потом отфильтровать
        )
        
        # Если collaborative filtering не дал результатов, используем content-based
        if not recommended_book_ids:
            recommended_book_ids = await self._content_based_recommendations(
                user_id=user_id,
                limit=limit * 2
            )
        
        # Если все еще нет результатов, используем popularity-based
        if not recommended_book_ids:
            return await self.get_trending_books(limit=limit)
        
        # Получаем книги
        books = []
        for book_id in recommended_book_ids[:limit]:
            book = await Book.get(book_id)
            if book and str(book.id) not in user_interacted_book_ids:
                books.append(book)
        
        # Если не хватило книг, дополняем популярными
        if len(books) < limit:
            trending = await self.get_trending_books(limit=limit - len(books))
            existing_ids = {str(b.id) for b in books}
            for book in trending:
                if str(book.id) not in existing_ids and str(book.id) not in user_interacted_book_ids:
                    books.append(book)
                    if len(books) >= limit:
                        break
        
        return books[:limit]
    
    async def _content_based_recommendations(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[str]:
        """
        Content-based рекомендации на основе жанров и авторов пользователя.
        
        Args:
            user_id: ID пользователя
            limit: Количество рекомендаций
            
        Returns:
            Список ID рекомендованных книг
        """
        user = await User.get(user_id)
        if not user:
            return []
        
        # Получаем книги, с которыми пользователь уже взаимодействовал
        user_interactions = await Interaction.find(
            Interaction.user_id == user_id
        ).to_list()
        user_interacted_book_ids = {str(i.book_id) for i in user_interactions}
        
        # Ищем книги по любимым жанрам и авторам
        query = {}
        
        if user.favorite_genres:
            query["genre"] = {"$in": user.favorite_genres}
        
        if user.favorite_authors:
            if "author" in query:
                # Если уже есть genre, используем $or
                query = {
                    "$or": [
                        {"genre": {"$in": user.favorite_genres}} if user.favorite_genres else {},
                        {"author": {"$in": user.favorite_authors}}
                    ]
                }
            else:
                query["author"] = {"$in": user.favorite_authors}
        
        if not query:
            return []
        
        # Получаем книги, сортируем по рейтингу
        books = await Book.find(query).sort(-Book.average_rating).limit(limit * 2).to_list()
        
        # Фильтруем уже взаимодействованные
        recommended = [
            str(book.id) for book in books
            if str(book.id) not in user_interacted_book_ids
        ]
        
        return recommended[:limit]
    
    async def get_similar_books(
        self,
        book_id: str,
        limit: int = 10
    ) -> List[Book]:
        """
        Получает похожие книги на основе жанра, автора и тегов.
        
        Args:
            book_id: ID книги
            limit: Количество похожих книг
            
        Returns:
            Список похожих книг
        """
        book = await Book.get(book_id)
        if not book:
            return []
        
        # Ищем книги того же жанра и автора
        similar_books = await Book.find(
            Book.genre == book.genre,
            Book.id != book.id
        ).sort(-Book.average_rating).limit(limit).to_list()
        
        # Если не хватило, добавляем книги того же автора
        if len(similar_books) < limit:
            author_books = await Book.find(
                Book.author == book.author,
                Book.id != book.id
            ).sort(-Book.average_rating).limit(limit - len(similar_books)).to_list()
            
            existing_ids = {str(b.id) for b in similar_books}
            for author_book in author_books:
                if str(author_book.id) not in existing_ids:
                    similar_books.append(author_book)
                    if len(similar_books) >= limit:
                        break
        
        return similar_books[:limit]
    
    async def get_trending_books(
        self,
        limit: int = 10,
        days: int = 30
    ) -> List[Book]:
        """
        Получает популярные книги за последние N дней.
        
        Args:
            limit: Количество книг
            days: Количество дней для анализа
            
        Returns:
            Список популярных книг
        """
        # Дата начала периода
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Получаем взаимодействия за период
        recent_interactions = await Interaction.find(
            Interaction.timestamp >= start_date
        ).to_list()
        
        # Подсчитываем популярность книг
        book_scores = {}
        weights = {
            InteractionType.VIEW: 1,
            InteractionType.LIKE: 3,
            InteractionType.CART: 5,
            InteractionType.PURCHASE: 10,
            InteractionType.REVIEW: 8
        }
        
        for interaction in recent_interactions:
            book_id_str = str(interaction.book_id)
            weight = weights.get(interaction.interaction_type, 1)
            book_scores[book_id_str] = book_scores.get(book_id_str, 0) + weight
        
        # Сортируем по убыванию популярности
        sorted_books = sorted(
            book_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        # Получаем объекты книг
        books = []
        for book_id_str, _ in sorted_books:
            book = await Book.get(book_id_str)
            if book:
                books.append(book)
        
        # Если не хватило, дополняем книгами с высоким рейтингом
        if len(books) < limit:
            top_rated = await Book.find().sort(-Book.average_rating).limit(limit - len(books)).to_list()
            existing_ids = {str(b.id) for b in books}
            for book in top_rated:
                if str(book.id) not in existing_ids:
                    books.append(book)
                    if len(books) >= limit:
                        break
        
        return books[:limit]
    
    async def get_recommendations_by_genre(
        self,
        genre: str,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> List[Book]:
        """
        Получает рекомендации по жанру.
        
        Args:
            genre: Жанр для рекомендаций
            limit: Количество книг
            user_id: ID пользователя (опционально, для исключения уже взаимодействованных)
            
        Returns:
            Список книг в указанном жанре
        """
        # Получаем книги жанра, сортируем по рейтингу
        books = await Book.find(
            Book.genre == genre
        ).sort(-Book.average_rating).limit(limit * 2).to_list()
        
        # Если указан user_id, исключаем уже взаимодействованные
        if user_id:
            user_interactions = await Interaction.find(
                Interaction.user_id == user_id
            ).to_list()
            user_interacted_book_ids = {str(i.book_id) for i in user_interactions}
            
            books = [b for b in books if str(b.id) not in user_interacted_book_ids]
        
        return books[:limit]

