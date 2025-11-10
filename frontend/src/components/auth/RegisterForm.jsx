import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../common/Button'
import Input from '../common/Input'
import { useAuth } from '../../hooks/useAuth'
import { GENRES } from '../../utils/constants'

const registerSchema = z
  .object({
    email: z.string().email('Введите корректный email'),
    username: z.string().min(3, 'Минимум 3 символа'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string().min(6, 'Минимум 6 символов'),
    full_name: z.string().optional(),
    favorite_genres: z.array(z.string()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

const RegisterForm = () => {
  const navigate = useNavigate()
  const { register: registerUser, login, registerStatus } = useAuth()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      favorite_genres: [],
    },
  })

  const selectedGenres = watch('favorite_genres')

  const toggleGenre = (genre) => {
    const genres = new Set(selectedGenres)
    if (genres.has(genre)) {
      genres.delete(genre)
    } else {
      genres.add(genre)
    }
    setValue('favorite_genres', Array.from(genres))
  }

  const onSubmit = async (values) => {
    try {
      const payload = {
        email: values.email,
        username: values.username,
        password: values.password,
        full_name: values.full_name,
        favorite_genres: values.favorite_genres,
      }
      await registerUser(payload)
      // Автоматически логинимся после успешной регистрации
      await login({ email: values.email, password: values.password })
      navigate('/')
    } catch (error) {
      // Ошибка уже обработана в useAuth
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email"
        type="email"
        placeholder="example@mail.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Имя пользователя"
        placeholder="booklover"
        error={errors.username?.message}
        {...register('username')}
      />
      <Input
        label="Полное имя"
        placeholder="Иван Иванов"
        error={errors.full_name?.message}
        {...register('full_name')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Пароль"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Подтверждение"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-700">Любимые жанры</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GENRES.map((genre) => {
            const selected = selectedGenres.includes(genre)
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-neutral-200 text-neutral-500 hover:border-primary/60'
                }`}
              >
                {genre}
              </button>
            )
          })}
        </div>
      </div>
      <Button type="submit" className="w-full" isLoading={registerStatus === 'pending'}>
        Создать аккаунт
      </Button>
      <p className="text-center text-sm text-neutral-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Войдите
        </Link>
      </p>
    </form>
  )
}

export default RegisterForm

