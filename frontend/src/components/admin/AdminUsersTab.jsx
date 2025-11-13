import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import AdminUsersTable from './AdminUsersTable'
import UserEditModal from './UserEditModal'
import Loading from '../common/Loading'
import ErrorMessage from '../common/ErrorMessage'
import Input from '../common/Input'
import Button from '../common/Button'
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from '../../hooks/useAdminUsers'

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

const StatCard = ({ label, value, tone = 'default' }) => {
  const toneStyles = {
    default: 'bg-neutral-50 text-neutral-900 border-neutral-100',
    info: 'bg-purple-50 text-purple-800 border-purple-100',
  }

  return (
    <div className={`flex flex-col justify-between rounded-2xl border p-5 ${toneStyles[tone] ?? toneStyles.default}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

const AdminUsersTab = () => {
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState(null)

  const adminUsersParams = useMemo(() => {
    const params = { page: 1, limit: 50 }
    if (userSearchTerm.trim()) {
      params.search = userSearchTerm.trim()
    }
    if (userRoleFilter !== 'all') {
      params.is_admin = userRoleFilter === 'admin'
    }
    return params
  }, [userSearchTerm, userRoleFilter])

  const {
    data: adminUsersData,
    isLoading: adminUsersLoading,
    isError: adminUsersError,
    refetch: refetchAdminUsers,
  } = useAdminUsers(adminUsersParams)

  const updateAdminUser = useUpdateAdminUser()
  const deleteAdminUser = useDeleteAdminUser()

  const adminUsers = adminUsersData?.items ?? []
  const adminUsersTotal = adminUsersData?.total_count ?? adminUsers.length

  const adminUsersRoleCounters = useMemo(() => {
    return adminUsers.reduce(
      (acc, user) => {
        if (user.is_admin) {
          acc.admin += 1
        } else {
          acc.user += 1
        }
        return acc
      },
      { admin: 0, user: 0 },
    )
  }, [adminUsers])

  const handleAdminUserUpdate = async (payload, { reset }) => {
    if (!editingUser) return
    try {
      await updateAdminUser.mutateAsync({ userId: editingUser.id, data: payload })
      reset()
      setIsUserModalOpen(false)
      setEditingUser(null)
      refetchAdminUsers()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAdminUserDelete = async (user) => {
    if (!window.confirm(`Удалить пользователя «${user.full_name || user.email}»?`)) {
      return
    }
    try {
      setDeletingUserId(user.id)
      await deleteAdminUser.mutateAsync(user.id)
      if (editingUser?.id === user.id) {
        setIsUserModalOpen(false)
        setEditingUser(null)
      }
      refetchAdminUsers()
    } catch (error) {
      console.error(error)
    } finally {
      setDeletingUserId(null)
    }
  }

  const resetUserFilters = () => {
    setUserSearchTerm('')
    setUserRoleFilter('all')
  }

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-card space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Пользователи</h2>
              <p className="text-sm text-neutral-500">
                Управление пользователями и правами доступа
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => refetchAdminUsers()}>
                Обновить данные
              </Button>
              <Button variant="secondary" size="sm" onClick={resetUserFilters}>
                Сбросить фильтры
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Всего пользователей" value={adminUsersTotal} />
            <StatCard
              label="Администраторы"
              value={adminUsersRoleCounters.admin}
              tone="info"
            />
            <StatCard label="Обычные пользователи" value={adminUsersRoleCounters.user} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Поиск по пользователям"
              placeholder="Email, имя пользователя..."
              value={userSearchTerm}
              onChange={(event) => setUserSearchTerm(event.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-neutral-700">Роль</label>
              <select
                className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={userRoleFilter}
                onChange={(event) => setUserRoleFilter(event.target.value)}
              >
                <option value="all">Все роли</option>
                <option value="admin">Администраторы</option>
                <option value="user">Пользователи</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <QuickFilter
              active={userRoleFilter === 'all'}
              label={`Все (${adminUsersTotal})`}
              onClick={() => setUserRoleFilter('all')}
            />
            <QuickFilter
              active={userRoleFilter === 'admin'}
              label={`Админы (${adminUsersRoleCounters.admin})`}
              onClick={() => setUserRoleFilter(userRoleFilter === 'admin' ? 'all' : 'admin')}
            />
            <QuickFilter
              active={userRoleFilter === 'user'}
              label={`Пользователи (${adminUsersRoleCounters.user})`}
              onClick={() => setUserRoleFilter(userRoleFilter === 'user' ? 'all' : 'user')}
            />
          </div>
        </div>

        {adminUsersLoading ? (
          <Loading message="Загружаем пользователей..." />
        ) : adminUsersError ? (
          <ErrorMessage
            description="Не удалось загрузить пользователей."
            action={
              <Button size="sm" variant="secondary" onClick={() => refetchAdminUsers()}>
                Повторить попытку
              </Button>
            }
          />
        ) : adminUsers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-neutral-500">
              По текущим фильтрам пользователи не найдены.
            </p>
          </div>
        ) : (
          <AdminUsersTable
            users={adminUsers}
            onEdit={(user) => {
              setEditingUser(user)
              setIsUserModalOpen(true)
            }}
            onDelete={handleAdminUserDelete}
            isDeletingId={deletingUserId}
          />
        )}
      </section>

      <UserEditModal
        user={editingUser}
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false)
          setEditingUser(null)
        }}
        onSubmit={handleAdminUserUpdate}
        isSubmitting={updateAdminUser.isPending}
      />
    </>
  )
}

export default AdminUsersTab

