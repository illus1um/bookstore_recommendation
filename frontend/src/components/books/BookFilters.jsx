import { useMemo } from 'react'
import { XCircle } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import { GENRES, SORT_OPTIONS } from '../../utils/constants'

const defaultFilters = {
  genres: [],
  author: '',
  min_price: '',
  max_price: '',
  sort: '',
  query: '',
}

const BookFilters = ({ value = {}, onChange, onReset }) => {
  const filters = useMemo(() => ({ ...defaultFilters, ...value }), [value])

  const handleCheckbox = (genre) => {
    const genres = new Set(filters.genres)
    if (genres.has(genre)) {
      genres.delete(genre)
    } else {
      genres.add(genre)
    }
    onChange?.({ ...filters, genres: Array.from(genres) })
  }

  const handleField = (field, fieldValue) => {
    onChange?.({ ...filters, [field]: fieldValue })
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Фильтры</h3>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-primary"
          onClick={onReset}
        >
          <XCircle className="h-4 w-4" />
          Сбросить
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <Input
          label="Автор"
          placeholder="Введите автора"
          value={filters.author}
          onChange={(event) => handleField('author', event.target.value)}
        />

        <div>
          <p className="text-sm font-medium text-neutral-700">Жанры</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {GENRES.map((genre) => {
              const checked = filters.genres.includes(genre)
              return (
                <label
                  key={genre}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    checked
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-neutral-200 text-neutral-600 hover:border-primary/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() => handleCheckbox(genre)}
                  />
                  {genre}
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Цена от"
            type="number"
            min={0}
            value={filters.min_price}
            onChange={(event) => handleField('min_price', event.target.value)}
          />
          <Input
            label="Цена до"
            type="number"
            min={0}
            value={filters.max_price}
            onChange={(event) => handleField('max_price', event.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-neutral-700">Сортировка</label>
          <select
            className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.sort}
            onChange={(event) => handleField('sort', event.target.value)}
          >
            <option value="">По умолчанию</option>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => onChange?.({ ...filters })} className="w-full">
          Применить
        </Button>
      </div>
    </div>
  )
}

export default BookFilters

