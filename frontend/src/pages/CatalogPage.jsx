import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookGrid from '../components/books/BookGrid'
import BookFilters from '../components/books/BookFilters'
import Button from '../components/common/Button'
import { useBookList } from '../hooks/useBooks'

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [filters, setFilters] = useState(() => ({
    genres: searchParams.getAll('genres'),
    author: searchParams.get('author') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || '',
    query: searchParams.get('query') || '',
  }))

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      query: searchParams.get('query') || '',
    }))
  }, [searchParams])

  const params = useMemo(
    () => ({
      ...filters,
      genres: filters.genres,
      page,
      limit: 12,
    }),
    [filters, page],
  )

  const { data, isLoading, isError } = useBookList(params)

  const books = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items || data.results || []
  }, [data])

  const total = data?.total ?? books.length
  const pageSize = data?.limit ?? 12
  const totalPages = total ? Math.ceil(total / pageSize) : page

  const applyFilters = (nextFilters) => {
    setFilters(nextFilters)
    setPage(1)
    const newParams = new URLSearchParams()
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return
      if (Array.isArray(value)) {
        value.forEach((val) => newParams.append(key, val))
      } else {
        newParams.set(key, value)
      }
    })
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const resetFilters = () => {
    setFilters({
      genres: [],
      author: '',
      min_price: '',
      max_price: '',
      sort: '',
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
      <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
        <aside className="lg:sticky lg:top-24">
          <BookFilters
            value={filters}
            onChange={applyFilters}
            onReset={resetFilters}
          />
        </aside>
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <h1 className="text-2xl font-semibold text-neutral-900">Каталог книг</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Найдено {total} книг{total === 0 ? '' : ''}
            </p>
          </div>
          <BookGrid books={books} isLoading={isLoading} isError={isError} />
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

