import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookGrid from '../components/books/BookGrid'
import BookFilters from '../components/books/BookFilters'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import { useBookFilters, useBookList } from '../hooks/useBooks'
import { useCartActions } from '../hooks/useCartActions'

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { handleAddToCart, handleToggleFavorite, isFavorite } = useCartActions()
  
  // Парсим фильтры из URL
  const parseFiltersFromURL = useCallback((params) => {
    const yearsFromURL = params.getAll('years')
    const parsedYears = yearsFromURL
      .map((y) => parseInt(y, 10))
      .filter((y) => !isNaN(y) && y > 0)

    return {
      genres: params.getAll('genres'),
      authors: params.getAll('authors'),
      languages: params.getAll('languages'),
      years: parsedYears,
      min_price: params.get('min_price') || '',
      max_price: params.get('max_price') || '',
      min_rating: params.get('min_rating') || '',
      max_rating: params.get('max_rating') || '',
      sort_by: params.get('sort_by') || 'newest',
      query: params.get('query') || '',
    }
  }, [])

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [filters, setFilters] = useState(() => parseFiltersFromURL(searchParams))

  // Синхронизируем фильтры при изменении URL
  useEffect(() => {
    const newPage = Number(searchParams.get('page')) || 1
    setPage(newPage)
    setFilters(parseFiltersFromURL(searchParams))
  }, [searchParams, parseFiltersFromURL])

  const params = useMemo(() => {
    const payload = {
      page,
      limit: 20,
      sort_by: filters.sort_by,
    }

    // Добавляем массивы только если они не пустые
    if (filters.genres?.length > 0) payload.genres = filters.genres
    if (filters.authors?.length > 0) payload.authors = filters.authors
    if (filters.languages?.length > 0) payload.languages = filters.languages
    if (filters.years?.length > 0) {
      // Годы должны быть числами
      payload.years = filters.years.map((y) => (typeof y === 'string' ? parseInt(y, 10) : y))
    }

    // Преобразуем строки в числа для числовых фильтров
    if (filters.min_price) payload.min_price = parseFloat(filters.min_price)
    if (filters.max_price) payload.max_price = parseFloat(filters.max_price)
    if (filters.min_rating) payload.min_rating = parseFloat(filters.min_rating)
    if (filters.max_rating) payload.max_rating = parseFloat(filters.max_rating)
    if (filters.query) payload.search = filters.query

    return payload
  }, [filters, page])

  const { data, isLoading, isError, refetch } = useBookList(params)
  const { data: availableFilters } = useBookFilters()

  const books = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items || data.results || []
  }, [data])

  const total = data?.total_count ?? books.length
  const pageSize = params.limit
  const totalPages = total ? Math.ceil(total / pageSize) : page

  const hasActiveFilters = useMemo(() => {
    return (
      filters.genres.length > 0 ||
      filters.authors.length > 0 ||
      filters.languages.length > 0 ||
      filters.years.length > 0 ||
      Boolean(filters.min_price) ||
      Boolean(filters.max_price) ||
      Boolean(filters.min_rating) ||
      Boolean(filters.max_rating) ||
      Boolean(filters.query)
    )
  }, [filters])

  const applyFilters = (nextFilters) => {
    // Обновляем фильтры и сбрасываем на первую страницу
    setFilters(nextFilters)
    setPage(1)
    
    // Обновляем URL параметры
    const newParams = new URLSearchParams()
    Object.entries(nextFilters).forEach(([key, value]) => {
      // Пропускаем пустые значения
      if (value === '' || value === null || value === undefined) return
      if (Array.isArray(value) && value.length === 0) return
      
      // Для массивов добавляем каждое значение отдельно
      if (Array.isArray(value)) {
        value.forEach((val) => newParams.append(key, String(val)))
      } else {
        newParams.set(key, String(value))
      }
    })
    newParams.set('page', '1')
    setSearchParams(newParams, { replace: true })
  }

  const resetFilters = () => {
    setFilters({
      genres: [],
      authors: [],
      languages: [],
      years: [],
      min_price: '',
      max_price: '',
      min_rating: '',
      max_rating: '',
      sort_by: 'newest',
      query: '',
    })
    setPage(1)
    setSearchParams({})
  }

  const changePage = (nextPage) => {
    setPage(nextPage)
    const paramsCopy = new URLSearchParams(searchParams)
    paramsCopy.set('page', String(nextPage))
    setSearchParams(paramsCopy)
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="space-y-6">
        <BookFilters
          value={filters}
          onChange={applyFilters}
          onReset={resetFilters}
          options={availableFilters}
        />
        
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">Каталог книг</h1>
                <p className="mt-2 text-sm text-neutral-500">
                  {isLoading ? 'Загружаем...' : `Найдено ${total} книг`}
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              )}
            </div>
          </div>

          {isError ? (
            <ErrorMessage
              description="Не удалось загрузить книги. Попробуйте ещё раз."
              action={
                <Button variant="secondary" size="sm" onClick={() => refetch()}>
                  Повторить попытку
                </Button>
              }
            />
          ) : (
            <>
              <BookGrid 
                books={books} 
                isLoading={isLoading} 
                isError={isError}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
              />
              {!isLoading && books.length === 0 && (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-12 text-center">
                  <p className="text-neutral-600">
                    {hasActiveFilters
                      ? 'По вашему запросу ничего не найдено. Попробуйте изменить фильтры.'
                      : 'В каталоге пока нет книг.'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="secondary" size="sm" onClick={resetFilters} className="mt-4">
                      Сбросить фильтры
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => changePage(page - 1)}
              >
                Предыдущая
              </Button>
              <p className="text-sm text-neutral-500">
                Страница {page} из {totalPages}
              </p>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => changePage(page + 1)}
              >
                Следующая
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CatalogPage

