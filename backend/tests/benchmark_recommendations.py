"""
Бенчмаркинг системы рекомендаций.
Измеряет производительность различных алгоритмов рекомендаций.
"""
import asyncio
import time
import statistics
from datetime import datetime
from typing import List, Dict, Any

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.models.user import User
from app.models.book import Book
from app.models.interaction import Interaction
from app.services.recommendation_engine import RecommendationEngine


class BenchmarkResults:
    """Класс для хранения результатов бенчмарка."""
    
    def __init__(self, name: str):
        self.name = name
        self.times: List[float] = []
        self.errors: int = 0
        self.success: int = 0
    
    def add_result(self, execution_time: float, success: bool = True):
        """Добавляет результат выполнения."""
        self.times.append(execution_time)
        if success:
            self.success += 1
        else:
            self.errors += 1
    
    def get_statistics(self) -> Dict[str, Any]:
        """Возвращает статистику."""
        if not self.times:
            return {
                "name": self.name,
                "error": "No data collected"
            }
        
        return {
            "name": self.name,
            "total_requests": len(self.times),
            "successful": self.success,
            "failed": self.errors,
            "min_time": min(self.times),
            "max_time": max(self.times),
            "mean_time": statistics.mean(self.times),
            "median_time": statistics.median(self.times),
            "stdev_time": statistics.stdev(self.times) if len(self.times) > 1 else 0,
            "total_time": sum(self.times),
            "requests_per_second": len(self.times) / sum(self.times) if sum(self.times) > 0 else 0
        }
    
    def print_statistics(self):
        """Выводит статистику."""
        stats = self.get_statistics()
        
        print(f"\n📊 {stats['name']}")
        print("-" * 60)
        print(f"  Всего запросов:        {stats['total_requests']}")
        print(f"  Успешных:              {stats['successful']}")
        print(f"  Ошибок:                {stats['failed']}")
        print(f"  Минимальное время:     {stats['min_time']*1000:.2f} мс")
        print(f"  Максимальное время:    {stats['max_time']*1000:.2f} мс")
        print(f"  Среднее время:         {stats['mean_time']*1000:.2f} мс")
        print(f"  Медианное время:       {stats['median_time']*1000:.2f} мс")
        print(f"  Стд. отклонение:       {stats['stdev_time']*1000:.2f} мс")
        print(f"  Запросов в секунду:    {stats['requests_per_second']:.2f}")


async def benchmark_collaborative_filtering(
    engine: RecommendationEngine,
    user_ids: List[str],
    iterations: int = 50
) -> BenchmarkResults:
    """Бенчмарк collaborative filtering рекомендаций."""
    results = BenchmarkResults("Collaborative Filtering (Персональные рекомендации)")
    
    print(f"\n🔄 Тестирование Collaborative Filtering ({iterations} итераций)...")
    
    for i in range(iterations):
        user_id = user_ids[i % len(user_ids)]
        
        start_time = time.time()
        try:
            recommendations = await engine.get_personalized_recommendations(
                user_id=user_id,
                limit=10
            )
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=True)
            
            if (i + 1) % 10 == 0:
                print(f"  ✓ Завершено {i + 1}/{iterations} итераций")
        except Exception as e:
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=False)
            print(f"  ✗ Ошибка на итерации {i + 1}: {e}")
    
    return results


async def benchmark_content_based(
    engine: RecommendationEngine,
    book_ids: List[str],
    iterations: int = 50
) -> BenchmarkResults:
    """Бенчмарк content-based рекомендаций."""
    results = BenchmarkResults("Content-Based (Похожие книги)")
    
    print(f"\n📚 Тестирование Content-Based ({iterations} итераций)...")
    
    for i in range(iterations):
        book_id = book_ids[i % len(book_ids)]
        
        start_time = time.time()
        try:
            similar_books = await engine.get_similar_books(
                book_id=book_id,
                limit=10
            )
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=True)
            
            if (i + 1) % 10 == 0:
                print(f"  ✓ Завершено {i + 1}/{iterations} итераций")
        except Exception as e:
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=False)
            print(f"  ✗ Ошибка на итерации {i + 1}: {e}")
    
    return results


async def benchmark_trending(
    engine: RecommendationEngine,
    iterations: int = 50
) -> BenchmarkResults:
    """Бенчмарк популярных книг."""
    results = BenchmarkResults("Popularity-Based (Трендовые книги)")
    
    print(f"\n🔥 Тестирование Trending ({iterations} итераций)...")
    
    for i in range(iterations):
        start_time = time.time()
        try:
            trending = await engine.get_trending_books(limit=10, days=7)
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=True)
            
            if (i + 1) % 10 == 0:
                print(f"  ✓ Завершено {i + 1}/{iterations} итераций")
        except Exception as e:
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=False)
            print(f"  ✗ Ошибка на итерации {i + 1}: {e}")
    
    return results


async def benchmark_cold_start(
    engine: RecommendationEngine,
    user_ids: List[str],
    iterations: int = 30
) -> BenchmarkResults:
    """Бенчмарк рекомендаций для новых пользователей."""
    results = BenchmarkResults("Cold Start (Рекомендации для новых пользователей)")
    
    print(f"\n❄️ Тестирование Cold Start ({iterations} итераций)...")
    
    for i in range(iterations):
        user_id = user_ids[i % len(user_ids)]
        
        start_time = time.time()
        try:
            recommendations = await engine.get_recommendations_for_new_user(
                user_id=user_id,
                limit=10
            )
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=True)
            
            if (i + 1) % 10 == 0:
                print(f"  ✓ Завершено {i + 1}/{iterations} итераций")
        except Exception as e:
            execution_time = time.time() - start_time
            results.add_result(execution_time, success=False)
            print(f"  ✗ Ошибка на итерации {i + 1}: {e}")
    
    return results


async def get_database_stats() -> Dict[str, Any]:
    """Получает статистику по базе данных."""
    users_count = await User.count()
    books_count = await Book.count()
    interactions_count = await Interaction.count()
    
    return {
        "users": users_count,
        "books": books_count,
        "interactions": interactions_count
    }


async def main():
    """Основная функция бенчмарка."""
    print("=" * 60)
    print("🚀 БЕНЧМАРК СИСТЕМЫ РЕКОМЕНДАЦИЙ")
    print("=" * 60)
    
    await connect_to_mongo()
    
    try:
        # Получаем статистику БД
        print("\n📊 Статистика базы данных:")
        db_stats = await get_database_stats()
        print(f"  Пользователей:      {db_stats['users']}")
        print(f"  Книг:               {db_stats['books']}")
        print(f"  Взаимодействий:     {db_stats['interactions']}")
        
        # Проверяем, достаточно ли данных
        if db_stats['users'] < 10 or db_stats['books'] < 10:
            print("\n⚠️ ВНИМАНИЕ: Недостаточно данных для бенчмарка!")
            print("   Запустите сначала: python -m tests.generate_test_data")
            return
        
        # Получаем ID для тестов
        print("\n📝 Подготовка тестовых данных...")
        users = await User.find().limit(50).to_list()
        books = await Book.find().limit(50).to_list()
        
        user_ids = [str(user.id) for user in users]
        book_ids = [str(book.id) for book in books]
        
        print(f"  ✓ Загружено {len(user_ids)} пользователей для тестов")
        print(f"  ✓ Загружено {len(book_ids)} книг для тестов")
        
        # Инициализируем движок рекомендаций
        engine = RecommendationEngine()
        
        # Запускаем бенчмарки
        start_time = datetime.now()
        
        results = []
        results.append(await benchmark_collaborative_filtering(engine, user_ids, iterations=50))
        results.append(await benchmark_content_based(engine, book_ids, iterations=50))
        results.append(await benchmark_trending(engine, iterations=30))
        results.append(await benchmark_cold_start(engine, user_ids, iterations=30))
        
        end_time = datetime.now()
        total_duration = (end_time - start_time).total_seconds()
        
        # Выводим результаты
        print("\n" + "=" * 60)
        print("📈 РЕЗУЛЬТАТЫ БЕНЧМАРКА")
        print("=" * 60)
        
        for result in results:
            result.print_statistics()
        
        # Общая статистика
        total_requests = sum(len(r.times) for r in results)
        total_errors = sum(r.errors for r in results)
        
        print("\n" + "=" * 60)
        print("📊 ОБЩАЯ СТАТИСТИКА")
        print("=" * 60)
        print(f"  Всего запросов:        {total_requests}")
        print(f"  Успешных:              {total_requests - total_errors}")
        print(f"  Ошибок:                {total_errors}")
        print(f"  Общее время:           {total_duration:.2f} сек")
        print(f"  Общий RPS:             {total_requests / total_duration:.2f}")
        
        # Сохраняем результаты в файл
        print("\n💾 Сохранение результатов...")
        save_results_to_file(results, db_stats, total_duration)
        print("  ✓ Результаты сохранены в tests/benchmark_results.txt")
        
    finally:
        await close_mongo_connection()
        print("\n🔌 Соединение с БД закрыто")


def save_results_to_file(results: List[BenchmarkResults], db_stats: Dict, duration: float):
    """Сохраняет результаты в файл."""
    with open("backend/tests/benchmark_results.txt", "w", encoding="utf-8") as f:
        f.write("=" * 60 + "\n")
        f.write("РЕЗУЛЬТАТЫ БЕНЧМАРКА СИСТЕМЫ РЕКОМЕНДАЦИЙ\n")
        f.write("=" * 60 + "\n")
        f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("СТАТИСТИКА БАЗЫ ДАННЫХ:\n")
        f.write(f"  Пользователей:      {db_stats['users']}\n")
        f.write(f"  Книг:               {db_stats['books']}\n")
        f.write(f"  Взаимодействий:     {db_stats['interactions']}\n\n")
        
        for result in results:
            stats = result.get_statistics()
            f.write(f"\n{stats['name']}\n")
            f.write("-" * 60 + "\n")
            f.write(f"  Всего запросов:        {stats['total_requests']}\n")
            f.write(f"  Успешных:              {stats['successful']}\n")
            f.write(f"  Ошибок:                {stats['failed']}\n")
            f.write(f"  Минимальное время:     {stats['min_time']*1000:.2f} мс\n")
            f.write(f"  Максимальное время:    {stats['max_time']*1000:.2f} мс\n")
            f.write(f"  Среднее время:         {stats['mean_time']*1000:.2f} мс\n")
            f.write(f"  Медианное время:       {stats['median_time']*1000:.2f} мс\n")
            f.write(f"  Стд. отклонение:       {stats['stdev_time']*1000:.2f} мс\n")
            f.write(f"  Запросов в секунду:    {stats['requests_per_second']:.2f}\n")
        
        total_requests = sum(len(r.times) for r in results)
        total_errors = sum(r.errors for r in results)
        
        f.write("\n" + "=" * 60 + "\n")
        f.write("ОБЩАЯ СТАТИСТИКА\n")
        f.write("=" * 60 + "\n")
        f.write(f"  Всего запросов:        {total_requests}\n")
        f.write(f"  Успешных:              {total_requests - total_errors}\n")
        f.write(f"  Ошибок:                {total_errors}\n")
        f.write(f"  Общее время:           {duration:.2f} сек\n")
        f.write(f"  Общий RPS:             {total_requests / duration:.2f}\n")


if __name__ == "__main__":
    asyncio.run(main())

