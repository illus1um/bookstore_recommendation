"""
API endpoints для работы с книгами: список, поиск, фильтры и CRUD операции.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from beanie import PydanticObjectId

from app.api.deps import get_current_admin_user, get_current_user
from app.models.book import Book
from app.schemas.book import (
    Book as BookSchema,
    BookCreate,
    BookFiltersResponse,
    BookListResponse,
    BookUpdate,
)

router = APIRouter()

MAX_BOOKS_LIMIT = 500


# --------------------------------------------------------------------------- #
#                                    HELPERS                                  #
# --------------------------------------------------------------------------- #


def _build_filter_conditions(
    genres: Optional[List[str]] = None,
    authors: Optional[List[str]] = None,
    languages: Optional[List[str]] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    max_rating: Optional[float] = None,
    years: Optional[List[int]] = None,
) -> List[Dict[str, Any]]:
    """Формирует список Mongo-условий для фильтрации каталога."""

    conditions: List[Dict[str, Any]] = []
    if genres:
        conditions.append({"genre": {"$in": genres}})
    if authors:
        conditions.append({"author": {"$in": authors}})
    if languages:
        conditions.append({"language": {"$in": languages}})
    if years:
        conditions.append({"publication_year": {"$in": years}})
    if min_price is not None or max_price is not None:
        price_cond: Dict[str, Any] = {}
        if min_price is not None:
            price_cond["$gte"] = min_price
        if max_price is not None:
            price_cond["$lte"] = max_price
        conditions.append({"price": price_cond})
    if min_rating is not None or max_rating is not None:
        rating_cond: Dict[str, Any] = {}
        if min_rating is not None:
            rating_cond["$gte"] = min_rating
        if max_rating is not None:
            rating_cond["$lte"] = max_rating
        conditions.append({"average_rating": rating_cond})
    return conditions


def _document_to_book(document: Dict[str, Any]) -> Book:
    """Преобразует Mongo документ в доменную модель Book."""

    doc = document.copy()
    doc["id"] = str(doc.pop("_id"))
    return Book.model_validate(doc)


def _resolve_sort(sort_by: Optional[str], text_search: bool = False) -> List[tuple]:
    """Определяет сортировку для обычного списка (find)."""

    sort_map = {
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "rating": [("average_rating", -1), ("created_at", -1)],
        "newest": [("created_at", -1)],
        "title": [("title", 1)],
        "popularity": [("average_rating", -1), ("stock", -1)],
    }
    if text_search and sort_by == "relevance":
        return [("text_score", -1), ("average_rating", -1)]
    return sort_map.get(sort_by or "newest", [("created_at", -1)])


def _resolve_agg_sort(sort_by: Optional[str], text_search: bool = False) -> Dict[str, int]:
    """Определяет сортировку для aggregation pipeline (использует словарь)."""

    sort_sequence = _resolve_sort(sort_by, text_search)
    return {field: direction for field, direction in sort_sequence}


def _compose_filter_query(conditions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Формирует итоговый Mongo фильтр."""

    if not conditions:
        return {}
    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


# --------------------------------------------------------------------------- #
#                                 ENDPOINTS                                   #
# --------------------------------------------------------------------------- #


@router.get("/", response_model=BookListResponse)
async def get_books(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=MAX_BOOKS_LIMIT),
    genres: Optional[List[str]] = Query(None),
    authors: Optional[List[str]] = Query(None),
    languages: Optional[List[str]] = Query(None),
    years: Optional[List[int]] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0),
    max_rating: Optional[float] = Query(None, ge=0.0, le=5.0),
    sort_by: Optional[str] = Query("newest"),
    search: Optional[str] = Query(None),
):
    """Возвращает список книг с фильтрами и пагинацией."""

    collection = Book.get_motor_collection()
    conditions = _build_filter_conditions(
        genres=genres,
        authors=authors,
        languages=languages,
        years=years,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        max_rating=max_rating,
    )

    if search:
        regex = {"$regex": search, "$options": "i"}
        conditions.append(
            {
                "$or": [
                    {"title": regex},
                    {"author": regex},
                    {"description": regex},
                    {"genre": regex},
                    {"tags": regex},
                ]
            }
        )

    mongo_filter = _compose_filter_query(conditions)

    skip = (page - 1) * limit
    sort_fields = _resolve_sort(sort_by, text_search=bool(search))

    cursor = collection.find(mongo_filter)
    if sort_fields:
        cursor = cursor.sort(sort_fields)
    cursor = cursor.skip(skip).limit(limit)

    documents = await cursor.to_list(length=limit)
    items = [_document_to_book(doc) for doc in documents]
    total = await collection.count_documents(mongo_filter)

    return BookListResponse(items=items, total_count=total, page=page, limit=limit)


@router.get("/search", response_model=BookListResponse)
async def search_books(
    q: Optional[str] = Query(None, description="Поисковый запрос"),
    genres: Optional[List[str]] = Query(None),
    authors: Optional[List[str]] = Query(None),
    languages: Optional[List[str]] = Query(None),
    years: Optional[List[int]] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0),
    max_rating: Optional[float] = Query(None, ge=0.0, le=5.0),
    sort_by: Optional[str] = Query("relevance"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=MAX_BOOKS_LIMIT),
):
    """Умный поиск по каталогу с текстовым и фильтрационным соответствием."""

    collection = Book.get_motor_collection()
    conditions = _build_filter_conditions(
        genres=genres,
        authors=authors,
        languages=languages,
        years=years,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        max_rating=max_rating,
    )

    pipeline: List[Dict[str, Any]] = []
    text_search_enabled = bool(q)

    if q:
        pipeline.append({"$match": {"$text": {"$search": q}}})
        pipeline.append({"$addFields": {"text_score": {"$meta": "textScore"}}})
        regex = {"$regex": q, "$options": "i"}
        conditions.append(
            {
                "$or": [
                    {"title": regex},
                    {"author": regex},
                    {"description": regex},
                    {"genre": regex},
                    {"tags": regex},
                ]
            }
        )

    if conditions:
        pipeline.append({"$match": _compose_filter_query(conditions)})

    sort_stage = _resolve_agg_sort(sort_by, text_search=text_search_enabled)
    skip = (page - 1) * limit

    pipeline.append(
        {
            "$facet": {
                "items": [
                    {"$sort": sort_stage},
                    {"$skip": skip},
                    {"$limit": limit},
                ],
                "total": [
                    {"$count": "count"},
                ],
            }
        }
    )

    aggregated = await collection.aggregate(pipeline).to_list(length=1)
    if aggregated:
        items_docs = aggregated[0].get("items", [])
        total_docs = aggregated[0].get("total", [])
        total_count = total_docs[0]["count"] if total_docs else 0
    else:
        items_docs = []
        total_count = 0

    items = [_document_to_book(doc) for doc in items_docs]
    return BookListResponse(items=items, total_count=total_count, page=page, limit=limit)


@router.get("/filters", response_model=BookFiltersResponse)
async def get_book_filters():
    """Возвращает уникальные значения для фильтров каталога."""

    collection = Book.get_motor_collection()

    genres = await collection.distinct("genre")
    authors = await collection.distinct("author")
    languages = await collection.distinct("language")
    years = await collection.distinct("publication_year")

    price_bounds = await collection.aggregate(
        [
            {
                "$group": {
                    "_id": None,
                    "min_price": {"$min": "$price"},
                    "max_price": {"$max": "$price"},
                }
            }
        ]
    ).to_list(length=1)

    price_range = {"min": None, "max": None}
    if price_bounds:
        price_range["min"] = price_bounds[0].get("min_price")
        price_range["max"] = price_bounds[0].get("max_price")

    return BookFiltersResponse(
        genres=sorted(filter(None, genres)),
        authors=sorted(filter(None, authors)),
        languages=sorted(filter(None, languages)),
        publication_years=sorted(filter(None, years)),
        price_range=price_range,
    )


@router.get("/bulk", response_model=List[BookSchema])
async def get_books_bulk(
    ids: List[str] = Query(
        ..., description="Список идентификаторов книг для выборки."
    ),
    current_user=Depends(get_current_user),
):
    """
    Возвращает список книг по переданным идентификаторам.
    """

    if not ids:
        return []

    object_ids: List[PydanticObjectId] = []
    for book_id in ids:
        try:
            object_ids.append(PydanticObjectId(book_id))
        except Exception as err:  # pylint: disable=broad-except
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Некорректный идентификатор книги: {book_id}",
            ) from err

    books = await Book.find({"_id": {"$in": object_ids}}).to_list()
    book_map = {str(book.id): book for book in books}

    ordered_books = [
        book_map[book_id] for book_id in ids if book_id in book_map
    ]

    return [BookSchema.model_validate(book) for book in ordered_books]


@router.get("/{book_id}", response_model=BookSchema)
async def get_book(book_id: str):
    """Получает детали книги по ID."""

    book = await Book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена",
        )
    return book


@router.post("/", response_model=BookSchema, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_data: BookCreate, current_user=Depends(get_current_admin_user)
):
    """Создаёт новую книгу (только для администратора)."""

    book = Book(**book_data.model_dump())
    await book.insert()
    return book


@router.put("/{book_id}", response_model=BookSchema)
async def update_book(
    book_id: str, book_update: BookUpdate, current_user=Depends(get_current_admin_user)
):
    """Обновляет книгу (только для администратора)."""

    book = await Book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена",
        )

    update_data = book_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)

    await book.save()
    return book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: str, current_user=Depends(get_current_admin_user)):
    """Удаляет книгу (только для администратора)."""

    book = await Book.get(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Книга не найдена",
        )

    await book.delete()
    return None

