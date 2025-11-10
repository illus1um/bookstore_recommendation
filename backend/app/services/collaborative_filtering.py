"""
Модуль для collaborative filtering рекомендаций.
Использует scikit-learn для поиска похожих пользователей.
"""
from typing import List, Dict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.models.user import User
from app.models.book import Book
from app.models.interaction import Interaction, InteractionType


class CollaborativeFiltering:
    """
    Класс для collaborative filtering рекомендаций.
    Находит похожих пользователей и рекомендует их книги.
    """
    
    def __init__(self):
        """Инициализация класса."""
        pass
    
    async def get_user_book_matrix(self) -> tuple[Dict[str, int], Dict[str, int], np.ndarray]:
        """
        Создает матрицу пользователь-книга.
        
        Returns:
            Кортеж (user_index_map, book_index_map, matrix)
            где matrix[i][j] - вес взаимодействия пользователя i с книгой j
        """
        # Получаем всех пользователей и книги
        users = await User.find_all().to_list()
        books = await Book.find_all().to_list()
        
        # Создаем маппинги
        user_index_map = {str(user.id): i for i, user in enumerate(users)}
        book_index_map = {str(book.id): i for i, book in enumerate(books)}
        
        # Создаем матрицу
        matrix = np.zeros((len(users), len(books)))
        
        # Получаем все взаимодействия
        interactions = await Interaction.find_all().to_list()
        
        # Заполняем матрицу весами взаимодействий
        for interaction in interactions:
            user_idx = user_index_map.get(str(interaction.user_id))
            book_idx = book_index_map.get(str(interaction.book_id))
            
            if user_idx is not None and book_idx is not None:
                # Веса для разных типов взаимодействий
                weights = {
                    InteractionType.VIEW: 1,
                    InteractionType.LIKE: 3,
                    InteractionType.CART: 5,
                    InteractionType.PURCHASE: 10,
                    InteractionType.REVIEW: 8
                }
                
                weight = weights.get(interaction.interaction_type, 1)
                
                # Если это review, добавляем бонус за рейтинг
                if interaction.interaction_type == InteractionType.REVIEW:
                    rating = interaction.metadata.get("rating", 3)
                    weight += rating
                
                matrix[user_idx][book_idx] += weight
        
        return user_index_map, book_index_map, matrix
    
    async def find_similar_users(
        self,
        user_id: str,
        n_similar: int = 5
    ) -> List[tuple[str, float]]:
        """
        Находит похожих пользователей.
        
        Args:
            user_id: ID пользователя
            n_similar: Количество похожих пользователей
            
        Returns:
            Список кортежей (user_id, similarity_score)
        """
        user_index_map, book_index_map, matrix = await self.get_user_book_matrix()
        
        if str(user_id) not in user_index_map:
            return []
        
        user_idx = user_index_map[str(user_id)]
        user_vector = matrix[user_idx:user_idx+1]
        
        # Вычисляем косинусное сходство
        similarities = cosine_similarity(user_vector, matrix)[0]
        
        # Создаем список (user_id, similarity) и сортируем
        user_similarities = [
            (user_id_str, similarities[i])
            for user_id_str, i in user_index_map.items()
            if user_id_str != str(user_id) and similarities[i] > 0
        ]
        
        # Сортируем по убыванию сходства
        user_similarities.sort(key=lambda x: x[1], reverse=True)
        
        return user_similarities[:n_similar]
    
    async def recommend_books_for_user(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[str]:
        """
        Рекомендует книги для пользователя на основе collaborative filtering.
        
        Args:
            user_id: ID пользователя
            limit: Количество рекомендаций
            
        Returns:
            Список ID рекомендованных книг
        """
        # Находим похожих пользователей
        similar_users = await self.find_similar_users(user_id, n_similar=5)
        
        if not similar_users:
            return []
        
        # Получаем книги, которые понравились похожим пользователям
        user_index_map, book_index_map, matrix = await self.get_user_book_matrix()
        
        if str(user_id) not in user_index_map:
            return []
        
        user_idx = user_index_map[str(user_id)]
        user_books = set()
        
        # Книги, которые уже взаимодействовал пользователь
        user_interactions = await Interaction.find(
            Interaction.user_id == user_id
        ).to_list()
        user_interacted_books = {str(i.book_id) for i in user_interactions}
        
        # Собираем книги похожих пользователей
        book_scores = {}
        
        for similar_user_id, similarity in similar_users:
            similar_user_idx = user_index_map.get(similar_user_id)
            if similar_user_idx is None:
                continue
            
            # Книги похожего пользователя
            similar_user_vector = matrix[similar_user_idx]
            
            for book_id_str, book_idx in book_index_map.items():
                if book_id_str in user_interacted_books:
                    continue
                
                score = similar_user_vector[book_idx] * similarity
                if score > 0:
                    book_scores[book_id_str] = book_scores.get(book_id_str, 0) + score
        
        # Сортируем по убыванию score
        recommended_books = sorted(
            book_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        return [book_id for book_id, _ in recommended_books]

