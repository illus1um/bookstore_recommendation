import { useMemo } from 'react'
import { XCircle } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import { SORT_OPTIONS } from '../../utils/constants'

const defaultFilters = {
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
}

const toggleValue = (values, value) => {
  const set = new Set(values)
  if (set.has(value)) {
    set.delete(value)
  } else {
    set.add(value)
  }
  return Array.from(set)
}

const BookFilters = ({ value = {}, onChange, onReset, options }) => {
  const filters = useMemo(() => ({ ...defaultFilters, ...value }), [value])

  const genres = options?.genres ?? []
  const authors = options?.authors ?? []
  const languages = options?.languages ?? []
  const years = options?.publication_years ?? []
  const priceRange = options?.price_range ?? {}

  const handleField = (field, fieldValue) => {
    onChange?.({ ...filters, [field]: fieldValue })
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-white to-neutral-50/50 shadow-lg ring-1 ring-neutral-900/5">
      {/* Заголовок */}
      <div className="border-b border-neutral-100 bg-white/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Фильтры каталога</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Найдите идеальную книгу по вашим критериям
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            onClick={onReset}
          >
            <XCircle className="h-4 w-4" />
            Сбросить
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Основные фильтры - красивая сетка */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Жанры */}
          {genres.length > 0 && (
            <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-xs font-bold text-white">📚</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Жанры</p>
                  <p className="text-xs text-neutral-500">Выберите категорию</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {genres.slice(0, 10).map((genre) => {
                  const checked = filters.genres.includes(genre)
                  return (
                    <button
                      key={genre}
                      type="button"
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        checked
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-500/50'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-sm'
                      }`}
                      onClick={() =>
                        handleField('genres', toggleValue(filters.genres, genre))
                      }
                    >
                      {genre}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Авторы */}
          {authors.length > 0 && (
            <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <span className="text-xs font-bold text-white">✍️</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Авторы</p>
                  <p className="text-xs text-neutral-500">Любимые писатели</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {authors.slice(0, 8).map((author) => {
                  const checked = filters.authors.includes(author)
                  return (
                    <button
                      key={author}
                      type="button"
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        checked
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/50'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-sm'
                      }`}
                      onClick={() =>
                        handleField('authors', toggleValue(filters.authors, author))
                      }
                    >
                      {author}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Сортировка */}
          <div className="rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <span className="text-xs font-bold text-white">🎯</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Сортировка</p>
                <p className="text-xs text-neutral-500">Порядок отображения</p>
              </div>
            </div>
            <select
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-emerald-400 hover:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={filters.sort_by}
              onChange={(event) => handleField('sort_by', event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Дополнительные фильтры */}
        <div className="mt-6 rounded-xl border border-neutral-100 bg-white p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <span className="text-lg">⚙️</span>
            Дополнительные параметры
          </h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Языки */}
            {languages.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <span>🌐</span> Языки
                </p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => {
                    const checked = filters.languages.includes(language)
                    return (
                      <button
                        key={language}
                        type="button"
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          checked
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm ring-2 ring-orange-500/50'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                        onClick={() =>
                          handleField('languages', toggleValue(filters.languages, language))
                        }
                      >
                        {language.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Годы издания */}
            {years.length > 0 && (
              <div>
                <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <span>📅</span> Год издания
                </p>
                <div className="flex flex-wrap gap-2">
                  {years.slice(-8).reverse().map((year) => {
                    const checked = filters.years.includes(year)
                    return (
                      <button
                        key={year}
                        type="button"
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          checked
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm ring-2 ring-indigo-500/50'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                        onClick={() =>
                          handleField('years', toggleValue(filters.years, year))
                        }
                      >
                        {year}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Цена */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                <span>💰</span> Диапазон цен
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder={`От ${priceRange.min || 0}`}
                  type="number"
                  min={0}
                  value={filters.min_price}
                  onChange={(event) => handleField('min_price', event.target.value)}
                  className="rounded-lg border-neutral-200 bg-neutral-50 text-sm transition hover:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Input
                  placeholder={`До ${priceRange.max || '∞'}`}
                  type="number"
                  min={0}
                  value={filters.max_price}
                  onChange={(event) => handleField('max_price', event.target.value)}
                  className="rounded-lg border-neutral-200 bg-neutral-50 text-sm transition hover:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Рейтинг */}
            <div>
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                <span>⭐</span> Рейтинг
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="От 0"
                  type="number"
                  min={0}
                  max={5}
                  step="0.5"
                  value={filters.min_rating}
                  onChange={(event) => handleField('min_rating', event.target.value)}
                  className="rounded-lg border-neutral-200 bg-neutral-50 text-sm transition hover:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Input
                  placeholder="До 5"
                  type="number"
                  min={0}
                  max={5}
                  step="0.5"
                  value={filters.max_rating}
                  onChange={(event) => handleField('max_rating', event.target.value)}
                  className="rounded-lg border-neutral-200 bg-neutral-50 text-sm transition hover:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookFilters

