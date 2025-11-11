import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { CheckCircle2 } from 'lucide-react'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { useCart } from '../hooks/useCart'
import { useCreateOrder } from '../hooks/useOrders'
import useUIStore from '../store/uiStore'
import { formatPrice } from '../utils/helpers'

const CHECKOUT_STEPS = [
  { id: 1, label: 'Адрес доставки', key: 'address' },
  { id: 2, label: 'Способ оплаты', key: 'payment' },
  { id: 3, label: 'Подтверждение', key: 'confirm' },
]

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, isLoading } = useCart()
  const createOrder = useCreateOrder()
  const { checkoutStep, setCheckoutStep, resetCheckout } = useUIStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      address: '',
      city: '',
      postal_code: '',
      country: '',
      payment_method: 'card',
    },
  })

  const formValues = watch()

  useEffect(() => {
    if (!isLoading && (!cart || !cart.items || cart.items.length === 0)) {
      navigate('/cart')
    }
  }, [cart, isLoading, navigate])

  useEffect(() => {
    return () => resetCheckout()
  }, [resetCheckout])

  if (isLoading) return <Loading message="Подготавливаем оформление..." />
  if (!cart || cart.items.length === 0) return null

  const onSubmit = async (values) => {
    try {
      const orderPayload = {
        shipping_address: {
          address: values.address,
          city: values.city,
          postal_code: values.postal_code,
          country: values.country,
        },
        payment_method: values.payment_method,
      }
      
      console.log('Отправка заказа:', orderPayload)
      
      const result = await createOrder.mutateAsync(orderPayload)
      
      console.log('Заказ создан:', result)
      
      // Сначала переходим на профиль, затем показываем уведомление
      resetCheckout()
      navigate('/profile', { replace: true })
      
      // Небольшая задержка для корректного отображения toast после перехода
      setTimeout(() => {
        toast.success('Заказ успешно оформлен!')
      }, 100)
    } catch (error) {
      console.error('Ошибка создания заказа:', error)
      console.error('Детали ошибки:', error.response?.data)
      
      const errorMessage = error.response?.data?.detail || 'Не удалось оформить заказ'
      
      // Если корзина пуста, перенаправляем в каталог
      if (errorMessage.includes('корзине нет товаров')) {
        toast.error('Корзина пуста. Добавьте товары перед оформлением заказа.')
        navigate('/catalog', { replace: true })
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const canProceedToStep2 =
    formValues.address && formValues.city && formValues.postal_code && formValues.country

  const renderStepContent = () => {
    switch (checkoutStep) {
      case 1:
  return (
          <div className="space-y-4">
          <Input
            label="Адрес"
            placeholder="Улица, дом, квартира"
            error={errors.address?.message}
            {...register('address', { required: 'Укажите адрес доставки' })}
          />
          <Input
            label="Город"
            placeholder="Москва"
            error={errors.city?.message}
            {...register('city', { required: 'Укажите город' })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Почтовый индекс"
              placeholder="123456"
              error={errors.postal_code?.message}
              {...register('postal_code', { required: 'Укажите индекс' })}
            />
            <Input
              label="Страна"
              placeholder="Россия"
              error={errors.country?.message}
              {...register('country', { required: 'Укажите страну' })}
            />
          </div>
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!canProceedToStep2}
              onClick={() => setCheckoutStep(2)}
            >
              Продолжить к оплате
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700">Способ оплаты</label>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-4 transition hover:border-primary">
                  <input
                    type="radio"
                    value="card"
                    {...register('payment_method')}
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm font-medium text-neutral-900">
                    Банковская карта
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-4 transition hover:border-primary">
                  <input
                    type="radio"
                    value="cash"
                    {...register('payment_method')}
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm font-medium text-neutral-900">
                    Наличными при получении
                  </span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setCheckoutStep(1)}
              >
                Назад
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => setCheckoutStep(3)}
              >
                Перейти к подтверждению
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <h4 className="mb-4 text-sm font-semibold text-neutral-900">Адрес доставки</h4>
              <p className="text-sm text-neutral-600">
                {formValues.address}, {formValues.city}
              </p>
              <p className="text-sm text-neutral-600">
                {formValues.postal_code}, {formValues.country}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <h4 className="mb-2 text-sm font-semibold text-neutral-900">Способ оплаты</h4>
              <p className="text-sm text-neutral-600">
                {formValues.payment_method === 'card'
                  ? 'Банковская карта'
                  : 'Наличными при получении'}
              </p>
            </div>
            {createOrder.isError && (
              <ErrorMessage description="Не удалось оформить заказ. Попробуйте ещё раз." />
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setCheckoutStep(2)}
                disabled={isSubmitting}
              >
                Назад
              </Button>
          <Button
            type="submit"
            size="lg"
            className="w-full"
                isLoading={isSubmitting || createOrder.isPending}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
          >
            Подтвердить заказ
          </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <form
          className="space-y-6 rounded-3xl bg-white p-8 shadow-card"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Оформление заказа</h1>
            <p className="text-sm text-neutral-500">
              Шаг {checkoutStep} из {CHECKOUT_STEPS.length}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between">
            {CHECKOUT_STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                    checkoutStep >= step.id
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {step.id}
                </div>
                <div className="ml-3 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      checkoutStep >= step.id ? 'text-neutral-900' : 'text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
                {index < CHECKOUT_STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      checkoutStep > step.id ? 'bg-primary' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {renderStepContent()}
        </form>

        <aside className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900">Ваш заказ</h2>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.book_id} className="flex items-start justify-between text-sm">
                <div>
                  <p className="font-medium text-neutral-900">{item.book.title}</p>
                  <p className="text-xs text-neutral-500">
                    {item.book.author} • {item.quantity} шт.
                  </p>
                </div>
                <span className="font-semibold text-neutral-700">
                  {formatPrice(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Товары</span>
              <span>{cart.total_items}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-semibold text-neutral-900">
              <span>Итого к оплате</span>
              <span>{formatPrice(cart.total_price)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CheckoutPage

