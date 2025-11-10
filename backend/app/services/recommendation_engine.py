"""
Современный движок рекомендаций для книжного магазина.
Реализует несколько независимых алгоритмов:
 - content-based (похожие книги)
 - collaborative filtering (user-based)
 - popularity/trending
 - cold-start обработку
 - подбор новинок
"""
from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from beanie import PydanticObjectId

from app.models.book import Book
from app.models.user import User
from app.models.interaction import Interaction, InteractionType


# Веса для различных типов взаимодействий
INTERACTION_WEIGHTS: Dict[InteractionType, float] = {
    InteractionType.VIEW: 1.0,
    InteractionType.LIKE: 3.0,
    InteractionType.ADD_TO_CART: 5.0,
    InteractionType.REMOVE_FROM_CART: -2.0,
    InteractionType.PURCHASE: 10.0,
    InteractionType.REVIEW: 8.0,
}

# Типы взаимодействий, которые учитываются при collaborative filtering
CF_INTERACTION_TYPES: Tuple[InteractionType, ...] = (
    InteractionType.VIEW,
    InteractionType.LIKE,
    InteractionType.ADD_TO_CART,
    InteractionType.PURCHASE,
    InteractionType.REVIEW,
)

# Ограничение числа кандидатов для content-based расчётов
MAX_CONTENT_CANDIDATES = 250


class RecommendationEngine:
    """Главный сервис рекомендаций."""

    def __init__(self) -> None:
        self._now = datetime.utcnow

    # ------------------------------------------------------------------ #
    #                      PUBLIC API МЕТОДЫ                             #
    # ------------------------------------------------------------------ #

    async def get_personal_recommendations(
        self, user_id: str, limit: int = 10
    ) -> List[Book]:
        """Основная точка входа – персональные рекомендации."""

        return await self.get_personalized_recommendations(user_id=user_id, limit=limit)

    async def get_personalized_recommendations(
        self, user_id: str, limit: int = 10
    ) -> List[Book]:
        """User-based collaborative filtering + cold-start fallback."""

        user = await User.get(user_id)
        if not user:
            return []

        target_interactions = await Interaction.find(
            {
                "user_id": user.id,
                "interaction_type": {"$in": [t.value for t in CF_INTERACTION_TYPES]},
            }
        ).to_list()

        user_seen_books = {str(interaction.book_id) for interaction in target_interactions}

        # Если совсем нет взаимодействий - cold start
        if not target_interactions:
            return await self.get_recommendations_for_new_user(user_id=user_id, limit=limit)

        # Строим матрицу пользователь-книга для всех релевантных взаимодействий
        all_interactions = await Interaction.find(
            {"interaction_type": {"$in": [t.value for t in CF_INTERACTION_TYPES]}}
        ).to_list()

        (
            user_index_map,
            book_index_map,
            user_item_matrix,
            book_popularity,
        ) = self._build_user_item_matrix(all_interactions)

        user_key = str(user.id)
        if user_key not in user_index_map:
            return await self.get_recommendations_for_new_user(user_id=user_id, limit=limit)

        target_index = user_index_map[user_key]
        target_vector = user_item_matrix[target_index : target_index + 1]

        if not np.any(target_vector):
            return await self.get_recommendations_for_new_user(user_id=user_id, limit=limit)

        similarities = cosine_similarity(target_vector, user_item_matrix)[0]
        similarities[target_index] = 0  # не сравниваем пользователя с самим собой

        candidate_scores: Dict[str, float] = defaultdict(float)

        # Загружаем объекты книг
        book_ids = list(book_index_map.keys())
        book_map = await self._load_books_map(book_ids)

        for other_user, other_idx in user_index_map.items():
            similarity = similarities[other_idx]
            if similarity <= 0:
                continue

            other_vector = user_item_matrix[other_idx]
            for book_id, book_idx in book_index_map.items():
                if other_vector[book_idx] <= 0:
                    continue
                if book_id in user_seen_books:
                    continue

                book = book_map.get(book_id)
                if not book:
                    continue

                interaction_strength = other_vector[book_idx]
                rating = book.average_rating or 4.0
                popularity_penalty = 1 + math.log(1 + book_popularity.get(book_id, 1))

                score = (similarity * interaction_strength * rating) / popularity_penalty
                candidate_scores[book_id] += score

        recommended = self._books_from_scores(candidate_scores, book_map, limit)

        if not recommended:
            return await self.get_recommendations_for_new_user(user_id=user_id, limit=limit)

        return recommended

    async def get_similar_books(self, book_id: str, limit: int = 10) -> List[Book]:
        """Content-based подбор похожих книг."""

        book = await Book.get(book_id)
        if not book:
            return []

        # Собираем пул кандидатов – книги того же жанра или с общими тегами
        candidate_query = Book.find(Book.id != book.id)
        if book.genre:
            candidate_query = candidate_query.find(Book.genre == book.genre)

        candidates = await candidate_query.limit(MAX_CONTENT_CANDIDATES).to_list()

        # Если нет кандидатов, расширяем поиск до всех книг
        if len(candidates) < max(limit * 2, 20):
            additional_candidates = await Book.find(Book.id != book.id).limit(
                MAX_CONTENT_CANDIDATES
            ).to_list()
            existing_ids = {str(c.id) for c in candidates}
            for candidate in additional_candidates:
                if str(candidate.id) not in existing_ids:
                    candidates.append(candidate)

        tag_scores = self._compute_tag_similarities(book, candidates)

        results: List[Tuple[float, Book]] = []
        for candidate, tag_score in zip(candidates, tag_scores):
            score = 0.0
            if candidate.genre and candidate.genre == book.genre:
                score += 3.0
            if candidate.author and candidate.author == book.author:
                score += 5.0
            if tag_score:
                score += tag_score * 5.0
            shared_tags = len(set(candidate.tags or []) & set(book.tags or []))
            score += shared_tags * 1.5
            if candidate.average_rating:
                score += float(candidate.average_rating) / 5.0

            if score > 0:
                results.append((score, candidate))

        results.sort(key=lambda item: item[0], reverse=True)
        return [book for _, book in results[:limit]]

    async def get_trending_books(
        self, limit: int = 10, days: int = 7
    ) -> List[Book]:
        """Популярные книги с учётом недавней активности."""

        now = self._now()
        start_date = now - timedelta(days=days)

        recent_interactions = await Interaction.find(
            {"timestamp": {"$gte": start_date}}
        ).to_list()

        if not recent_interactions:
            return await Book.find().sort(-Book.average_rating).limit(limit).to_list()

        book_scores: Dict[str, float] = defaultdict(float)

        for interaction in recent_interactions:
            weight = INTERACTION_WEIGHTS.get(interaction.interaction_type, 0)
            if weight <= 0:
                continue

            recency = self._recency_multiplier(now, interaction.timestamp)
            book_scores[str(interaction.book_id)] += weight * recency

        if not book_scores:
            return await Book.find().sort(-Book.average_rating).limit(limit).to_list()

        books_map = await self._load_books_map(book_scores.keys())
        scored_books: List[Tuple[float, Book]] = []

        for book_id, raw_score in book_scores.items():
            book = books_map.get(book_id)
            if not book:
                continue
            rating = book.average_rating or 4.0
            score = raw_score * rating
            scored_books.append((score, book))

        scored_books.sort(key=lambda item: item[0], reverse=True)
        result = [book for _, book in scored_books[:limit]]

        if len(result) < limit:
            fallback = await Book.find().sort(-Book.average_rating).limit(
                limit - len(result)
            ).to_list()
            existing = {str(book.id) for book in result}
            for book in fallback:
                if str(book.id) not in existing:
                    result.append(book)
        return result[:limit]

    async def get_new_books(
        self, limit: int = 10, user: Optional[User] = None, days: int = 60
    ) -> List[Book]:
        """Новинки каталога, опционально с учётом предпочтений пользователя."""

        cutoff = self._now() - timedelta(days=days)
        query = Book.find(Book.created_at >= cutoff)

        if user and user.favorite_genres:
            query = query.find({"genre": {"$in": user.favorite_genres}})

        books = await query.sort(-Book.created_at).limit(limit * 2).to_list()

        if len(books) < limit:
            additional = await Book.find().sort(-Book.created_at).limit(
                limit * 2
            ).to_list()
            existing = {str(book.id) for book in books}
            for book in additional:
                if str(book.id) not in existing:
                    books.append(book)

        return books[:limit]

    async def get_recommendations_for_new_user(
        self, user_id: str, limit: int = 10
    ) -> List[Book]:
        """Стратегия для новых пользователей."""

        user = await User.get(user_id)
        if not user:
            return await self.get_trending_books(limit=limit)

        genre_quota = max(1, int(limit * 0.6))
        recommendations: List[Book] = []
        seen: set[str] = set()

        if user.favorite_genres:
            preferred = await Book.find(
                {"genre": {"$in": user.favorite_genres}}
            ).sort(-Book.average_rating).limit(genre_quota * 2).to_list()

            for book in preferred:
                if str(book.id) not in seen:
                    recommendations.append(book)
                    seen.add(str(book.id))
                if len(recommendations) >= genre_quota:
                    break

        remaining = limit - len(recommendations)
        if remaining > 0:
            trending = await self.get_trending_books(limit=remaining)
            for book in trending:
                if str(book.id) not in seen:
                    recommendations.append(book)
                    seen.add(str(book.id))

        if len(recommendations) < limit:
            new_books = await self.get_new_books(limit=limit)
            for book in new_books:
                if str(book.id) not in seen:
                    recommendations.append(book)
                    seen.add(str(book.id))
                if len(recommendations) >= limit:
                    break

        return recommendations[:limit]

    async def get_recommendations_by_genre(
        self, genre: str, limit: int = 10, user_id: Optional[str] = None
    ) -> List[Book]:
        """Подбор книг в рамках жанра с учётом активности пользователя."""

        query = Book.find(Book.genre == genre)
        books = await query.sort(-Book.average_rating).limit(limit * 3).to_list()

        if user_id:
            interactions = await Interaction.find({"user_id": user_id}).to_list()
            seen = {str(inter.book_id) for inter in interactions}
            books = [book for book in books if str(book.id) not in seen]

        if len(books) < limit:
            trending = await self.get_trending_books(limit=limit)
            existing = {str(book.id) for book in books}
            for book in trending:
                if book.genre == genre and str(book.id) not in existing:
                    books.append(book)
                if len(books) >= limit:
                    break

        return books[:limit]

    # ------------------------------------------------------------------ #
    #                         ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ                     #
    # ------------------------------------------------------------------ #

    async def _load_books_map(self, book_ids: Iterable[str]) -> Dict[str, Book]:
        """Загружает книги по ID и возвращает словарь."""

        object_ids = [PydanticObjectId(book_id) for book_id in set(book_ids)]
        books = await Book.find({"_id": {"$in": object_ids}}).to_list()
        return {str(book.id): book for book in books}

    def _interaction_weight(self, interaction: Interaction) -> float:
        """Вычисляет вес взаимодействия с учётом метаданных."""

        base_weight = INTERACTION_WEIGHTS.get(interaction.interaction_type, 0.0)
        metadata = getattr(interaction, "metadata", None)

        def _get(field: str, default=None):
            if metadata is None:
                return default
            value = getattr(metadata, field, default)
            if value is None and isinstance(metadata, dict):
                return metadata.get(field, default)
            return value

        if interaction.interaction_type in (InteractionType.PURCHASE, InteractionType.ADD_TO_CART):
            quantity = _get("quantity", 0) or 0
            base_weight += float(quantity)
            price = _get("price_at_purchase", 0) or 0
            base_weight += float(price) / 1000.0  # небольшая поправка за дорогие покупки

        if interaction.interaction_type == InteractionType.REVIEW:
            rating = _get("rating")
            if rating:
                base_weight += float(rating)

        if interaction.interaction_type == InteractionType.VIEW:
            duration = _get("duration")
            if duration:
                base_weight += min(float(duration) / 120.0, 2.0)

        return max(base_weight, 0.0)

    def _build_user_item_matrix(
        self, interactions: Sequence[Interaction]
    ) -> Tuple[Dict[str, int], Dict[str, int], np.ndarray, Dict[str, float]]:
        """Формирует матрицу пользователь-книга."""

        user_index_map: Dict[str, int] = {}
        book_index_map: Dict[str, int] = {}

        for interaction in interactions:
            user_id = str(interaction.user_id)
            book_id = str(interaction.book_id)
            if user_id not in user_index_map:
                user_index_map[user_id] = len(user_index_map)
            if book_id not in book_index_map:
                book_index_map[book_id] = len(book_index_map)

        matrix = np.zeros((len(user_index_map), len(book_index_map)), dtype=float)
        book_popularity: Dict[str, float] = defaultdict(float)

        for interaction in interactions:
            user_idx = user_index_map[str(interaction.user_id)]
            book_idx = book_index_map[str(interaction.book_id)]
            weight = self._interaction_weight(interaction)
            if weight <= 0:
                continue
            matrix[user_idx, book_idx] += weight
            book_popularity[str(interaction.book_id)] += weight

        return user_index_map, book_index_map, matrix, book_popularity

    def _books_from_scores(
        self, scores: Dict[str, float], book_map: Dict[str, Book], limit: int
    ) -> List[Book]:
        """Возвращает книги, отсортированные по убыванию score."""

        if not scores:
            return []

        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        result: List[Book] = []
        seen: set[str] = set()
        for book_id, _ in ranked:
            book = book_map.get(book_id)
            if not book:
                continue
            if book_id in seen:
                continue
            result.append(book)
            seen.add(book_id)
            if len(result) >= limit:
                break
        return result

    def _recency_multiplier(self, now: datetime, timestamp: datetime) -> float:
        """Временной коэффициент: чем свежее взаимодействие, тем больше вес."""

        delta = max((now - timestamp).total_seconds(), 0)
        days = delta / 86400.0
        return 1 / (1 + days)

    def _compute_tag_similarities(
        self, base_book: Book, candidates: Sequence[Book]
    ) -> np.ndarray:
        """Вычисляет TF-IDF сходство между тегами книг."""

        corpus = [" ".join((base_book.tags or []))]
        corpus.extend(" ".join(book.tags or []) for book in candidates)

        if len(set(corpus)) <= 1:
            # Если у всех книг одинаковый набор тегов или их нет – возвращаем нули
            return np.zeros(len(candidates))

        vectorizer = TfidfVectorizer().fit_transform(corpus)
        base_vector = vectorizer[0:1]
        candidate_vectors = vectorizer[1:]
        similarities = cosine_similarity(base_vector, candidate_vectors).flatten()
        return similarities


