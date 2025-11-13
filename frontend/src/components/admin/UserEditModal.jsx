import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Input from '../common/Input'
import { formatDate } from '../../utils/helpers'

const UserEditModal = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      full_name: '',
      age: '',
      is_admin: false,
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        age: user.age || '',
        is_admin: user.is_admin || false,
      })
    }
  }, [user, reset])

  if (!user) return null

  const submitHandler = handleSubmit((values) => {
    const payload = {
      full_name: values.full_name || null,
      age: values.age ? parseInt(values.age, 10) : null,
      is_admin: values.is_admin,
    }
    onSubmit(payload, { reset })
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактирование пользователя"
      description={`ID: ${user.id}`}
      size="lg"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5">
          <dl className="grid gap-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="font-medium text-neutral-700">Email</dt>
              <dd className="text-neutral-900">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-neutral-700">Username</dt>
              <dd className="text-neutral-900">{user.username}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-medium text-neutral-700">Дата регистрации</dt>
              <dd className="text-neutral-600">{formatDate(user.created_at)}</dd>
            </div>
            {user.last_login && (
              <div className="flex items-center justify-between">
                <dt className="font-medium text-neutral-700">Последний вход</dt>
                <dd className="text-neutral-600">{formatDate(user.last_login)}</dd>
              </div>
            )}
          </dl>
        </div>

        <form onSubmit={submitHandler} className="space-y-5">
          <Input
            label="Полное имя"
            placeholder="Иван Иванов"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <Input
            label="Возраст"
            type="number"
            placeholder="25"
            error={errors.age?.message}
            {...register('age')}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_admin"
              className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-2 focus:ring-primary/20"
              {...register('is_admin')}
            />
            <label htmlFor="is_admin" className="text-sm font-medium text-neutral-700">
              Администратор
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!isDirty}
            >
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default UserEditModal

