import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  Eye,
  Heart,
  ShoppingCart,
  Trash2,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import Input from '../common/Input'
import Button from '../common/Button'
import { useAdminInteractions } from '../../hooks/useInteractions'
import { INTERACTION_TYPES } from '../../utils/constants'
import { formatDate, formatPrice } from '../../utils/helpers'

const INTERACTION_LABELS = {
  [INTERACTION_TYPES.VIEW]: 'Просмотр',
  [INTERACTION_TYPES.LIKE]: 'Лайк',
  [INTERACTION_TYPES.ADD_TO_CART]: 'Добавление в корзину',
  [INTERACTION_TYPES.REMOVE_FROM_CART]: 'Удаление из корзины',
  [INTERACTION_TYPES.PURCHASE]: 'Покупка',
  [INTERACTION_TYPES.REVIEW]: 'Отзыв',
}

const INTERACTION_META = {
  [INTERACTION_TYPES.VIEW]: {
    badge: 'bg-sky-100 text-sky-700',
    icon: Eye,
  },
  [INTERACTION_TYPES.LIKE]: {
    badge: 'bg-pink-100 text-pink-700',
    icon: Heart,
  },
  [INTERACTION_TYPES.ADD_TO_CART]: {
    badge: 'bg-emerald-100 text-emerald-700',
    icon: ShoppingCart,
  },
  [INTERACTION_TYPES.REMOVE_FROM_CART]: {
    badge: 'bg-amber-100 text-amber-700',
    icon: Trash2,
  },
  [INTERACTION_TYPES.PURCHASE]: {
    badge: 'bg-purple-100 text-purple-700',
    icon: ShoppingBag,
  },
  [INTERACTION_TYPES.REVIEW]: {
    badge: 'bg-indigo-100 text-indigo-700',
    icon: MessageCircle,
  },
}

const QuickFilter = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
      active
        ? 'border-primary bg-primary/10 text-primary shadow-sm'
        : 'border-neutral-200 text-neutral-500 hover:border-primary hover:text-primary'
    }`}
  >
    {label}
  </button>
)

const AdminInteractionsTab = () => {
  const [typeFilter, setTypeFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('')
  const [bookFilter, setBookFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const params = useMemo(() => {
    const result = { page: 1, limit: 200 }
    if (typeFilter !== 'all') {
      result.interaction_type = typeFilter
    }
    if (userFilter.trim()) {
      result.user_id = userFilter.trim()
    }
    if (bookFilter.trim()) {
      result.book_id = bookFilter.trim()
    }
    return result
  }, [typeFilter, userFilter, bookFilter])

  const { data, isLoading, isError, refetch } = useAdminInteractions(params)

  const items = data?.items ?? []
  const total = data?.total_count ?? items.length

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.trim().toLowerCase()
    return items.filter((interaction) => {
      const fields = [
        interaction.user_email,
        interaction.user_full_name,
        interaction.book_title,
        interaction.book_author,
        interaction.metadata?.comment,
      ]
      return fields.filter(Boolean).some((field) => field.toLowerCase().includes(term))
    })
  }, [items, searchTerm])

  const resetFilters = () => {
    setTypeFilter('all')
    setUserFilter('')
    setBookFilter('')
    setSearchTerm('')
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-card space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Взаимодействия</h2>
            <p className="text-sm text-neutral-500">
              История действий пользователей с книгами
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              Обновить данные
            </Button>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Поиск"
            placeholder="Email, имя, комментарий..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Input
            label="ID пользователя"
            placeholder="613c..."
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
          />
          <Input
            label="ID книги"
            placeholder="613c..."
            value={bookFilter}
            onChange={(event) => setBookFilter(event.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-neutral-700">Тип действия</label>
            <select
              className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">Все действия</option>
              {Object.entries(INTERACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <QuickFilter
            active={typeFilter === 'all'}
            label={`Все (${total})`}
            onClick={() => setTypeFilter('all')}
          />
          {Object.entries(INTERACTION_LABELS).map(([value, label]) => (
            <QuickFilter
              key={value}
              active={typeFilter === value}
              label={label}
              onClick={() => setTypeFilter(typeFilter === value ? 'all' : value)}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loading message="Загружаем взаимодействия..." />
      ) : isError ? (
        <ErrorMessage
          description="Не удалось загрузить взаимодействия."
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Повторить попытку
            </Button>
          }
        />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <p className="text-sm text-neutral-500">
            По текущим фильтрам взаимодействия не найдены.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-card">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Пользователь</th>
                  <th className="px-4 py-3 font-medium">Действие</th>
                  <th className="px-4 py-3 font-medium">Книга</th>
                  <th className="px-4 py-3 font-medium">Метаданные</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredItems.map((interaction) => (
                  <tr
                    key={interaction.id}
                    className="hover:bg-neutral-50/70"
                  >
                    <td className="px-4 py-3 text-neutral-700">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-neutral-900">
                          {interaction.user_full_name || '—'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {interaction.user_email || '—'}
                        </span>
                        <span className="text-xs text-neutral-400">
                          ID: {interaction.user_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <TypeBadge type={interaction.interaction_type} />
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">
                          {interaction.book_title || 'Неизвестная книга'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {interaction.book_author || 'Автор не указан'}
                        </span>
                        <span className="text-xs text-neutral-400">ID: {interaction.book_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      <MetadataPreview interaction={interaction} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      <div className="flex flex-col">
                        <span>{formatDate(interaction.timestamp)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

const MetadataPreview = ({ interaction }) => {
  if (!interaction?.metadata || Object.keys(interaction.metadata).length === 0) {
    return <span>—</span>
  }

  const { metadata, interaction_type: type } = interaction

  if (type === INTERACTION_TYPES.PURCHASE) {
    const quantity = metadata.quantity ?? 1
    const price = metadata.price_at_purchase ?? 0
    return (
      <div className="flex flex-wrap gap-1">
        <MetadataChip tone="emerald">Кол-во: {quantity}</MetadataChip>
        <MetadataChip tone="purple">Сумма: {formatPrice(quantity * price)}</MetadataChip>
      </div>
    )
  }

  if (type === INTERACTION_TYPES.REVIEW && metadata.rating) {
    return (
      <div className="flex flex-wrap gap-1">
        <MetadataChip tone="indigo">Оценка: {metadata.rating}</MetadataChip>
        {metadata.comment && (
          <MetadataChip tone="neutral">“{metadata.comment}”</MetadataChip>
        )}
      </div>
    )
  }

  if (type === INTERACTION_TYPES.VIEW && metadata.duration) {
    return <MetadataChip tone="sky">Просмотрено {metadata.duration} сек.</MetadataChip>
  }

  if (metadata.comment) {
    return <MetadataChip tone="neutral">Комментарий: “{metadata.comment}”</MetadataChip>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(metadata).map(([key, value]) => (
        <MetadataChip key={key} tone="neutral">
          {key}: {String(value)}
        </MetadataChip>
      ))}
    </div>
  )
}

const MetadataChip = ({ children, tone = 'neutral' }) => {
  const colors = {
    neutral: 'bg-neutral-100 text-neutral-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    purple: 'bg-purple-100 text-purple-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    sky: 'bg-sky-100 text-sky-700',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium',
        colors[tone] ?? colors.neutral,
      )}
    >
      {children}
    </span>
  )
}

const TypeBadge = ({ type }) => {
  const meta = INTERACTION_META[type] ?? {}
  const Icon = meta.icon ?? Eye
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
        meta.badge ?? 'bg-neutral-100 text-neutral-600',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {INTERACTION_LABELS[type] ?? type}
    </span>
  )
}

export default AdminInteractionsTab
