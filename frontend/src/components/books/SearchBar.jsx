import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBookSearch } from '../../hooks/useBooks'
import Input from '../common/Input'

const SearchBar = () => {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(term), 400)
    return () => clearTimeout(handler)
  }, [term])

  const { data, isFetching } = useBookSearch(
    debounced ? { q: debounced, limit: 5 } : null,
  )

  const suggestions = useMemo(() => data ?? [], [data])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (term.trim()) {
      navigate(`/catalog?query=${encodeURIComponent(term.trim())}`)
      setIsFocused(false)
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <Input
          value={term}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Поиск по названию, автору или жанру..."
          leftAddon={<Search className="h-4 w-4" />}
          rightAddon={
            isFetching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null
          }
        />
      </form>
      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
          <ul className="divide-y divide-neutral-100">
            {suggestions.map((book) => (
              <li key={book.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                  onMouseDown={() => {
                    navigate(`/books/${book.id}`)
                  }}
                >
                  <div className="flex h-12 w-8 flex-none overflow-hidden rounded bg-neutral-100">
                    {book.cover_image_url && (
                      <img
                        src={book.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{book.title}</p>
                    <p className="text-xs text-neutral-500">{book.author}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="w-full bg-neutral-50 px-4 py-2 text-sm text-primary hover:bg-neutral-100"
            onMouseDown={() => navigate(`/catalog?query=${encodeURIComponent(term)}`)}
          >
            Показать все результаты
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchBar

