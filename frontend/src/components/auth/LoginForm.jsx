import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../common/Button'
import Input from '../common/Input'
import { useAuth } from '../../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

const LoginForm = () => {
  const navigate = useNavigate()
  const { login, loginStatus } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await login(values)
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
        label="Пароль"
        type="password"
        placeholder="Введите пароль"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" className="w-full" isLoading={loginStatus === 'pending'}>
        Войти
      </Button>
      <p className="text-center text-sm text-neutral-500">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Зарегистрируйтесь
        </Link>
      </p>
    </form>
  )
}

export default LoginForm

