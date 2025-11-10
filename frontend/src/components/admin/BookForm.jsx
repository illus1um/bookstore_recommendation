import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '../common/Button'
import Input from '../common/Input'
import { GENRES } from '../../utils/constants'

const schema = z.object({
  title: z.string().min(1, 'Укажите название'),
  author: z.string().min(1, 'Укажите автора'),
  isbn: z.string().optional(),
  description: z.string().min(1, 'Добавьте описание'),
  genre: z.string().min(1, 'Выберите жанр'),
  publisher: z.string().min(1, 'Укажите издательство'),
  publication_year: z.coerce
    .number({ invalid_type_error: 'Введите год' })
    .int()
    .min(1900, 'Слишком ранний год')
    .max(new Date().getFullYear() + 1, 'Слишком поздний год'),
  page_count: z.coerce
    .number({ invalid_type_error: 'Введите количество страниц' })
    .int()
    .min(1),
  language: z.string().min(1).default('ru'),
  cover_image_url: z.string().url('Введите корректный URL'),
  price: z.coerce.number({ invalid_type_error: 'Введите цену' }).min(0),
  stock: z.coerce.number({ invalid_type_error: 'Введите остаток' }).int().min(0),
  average_rating: z.coerce.number().min(0).max(5).optional(),
  tags: z.string().optional(),
})

const BookForm = ({ onSubmit, isSubmitting, initialData }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      author: '',
      isbn: '',
      description: '',
      genre: '',
      publisher: '',
      publication_year: new Date().getFullYear(),
      page_count: 350,
      language: 'ru',
      cover_image_url: '',
      price: 500,
      stock: 10,
      average_rating: 4,
      tags: '',
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        tags: (initialData.tags || []).join(', '),
      })
    }
  }, [initialData, reset])

  const submitHandler = handleSubmit((values) => {
    const payload = {
      ...values,
      tags: values.tags
        ? values.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
    }
    onSubmit(payload, { reset })
  })

  return (
    <form className="space-y-5" onSubmit={submitHandler}>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Название"
          error={errors.title?.message}
          {...register('title')}
        />
        <Input
          label="Автор"
          error={errors.author?.message}
          {...register('author')}
        />
        <Input label="ISBN" error={errors.isbn?.message} {...register('isbn')} />
        <Input
          label="Издательство"
          error={errors.publisher?.message}
          {...register('publisher')}
        />
        <Input
          label="Год издания"
          type="number"
          error={errors.publication_year?.message}
          {...register('publication_year')}
        />
        <Input
          label="Количество страниц"
          type="number"
          error={errors.page_count?.message}
          {...register('page_count')}
        />
        <div>
          <label className="text-sm font-medium text-neutral-700">Жанр</label>
          <select
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            {...register('genre')}
          >
            <option value="">Выберите жанр</option>
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          {errors.genre && (
            <p className="mt-1 text-xs text-red-500">{errors.genre.message}</p>
          )}
        </div>
        <Input
          label="Язык"
          error={errors.language?.message}
          {...register('language')}
        />
        <Input
          label="Цена"
          type="number"
          error={errors.price?.message}
          {...register('price')}
        />
        <Input
          label="Остаток"
          type="number"
          error={errors.stock?.message}
          {...register('stock')}
        />
        <Input
          label="Рейтинг (0-5)"
          type="number"
          error={errors.average_rating?.message}
          step="0.1"
          {...register('average_rating')}
        />
        <Input
          label="Обложка (URL)"
          error={errors.cover_image_url?.message}
          {...register('cover_image_url')}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-neutral-700">Описание</label>
        <textarea
          className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <Input
        label="Теги (через запятую)"
        placeholder="бестселлер, новинка"
        error={errors.tags?.message}
        {...register('tags')}
      />

      <div className="flex items-center justify-between">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!isDirty && !initialData}
        >
          {initialData ? 'Обновить книгу' : 'Создать книгу'}
        </Button>
        {initialData ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset()}
          >
            Сбросить изменения
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export default BookForm

