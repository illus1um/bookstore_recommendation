import Button from '../common/Button'
import { formatDate } from '../../utils/helpers'

const AdminUsersTable = ({ users = [], onEdit, onDelete, isDeletingId }) => {
  if (!users.length) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center text-neutral-500">
        Пользователи не найдены
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-card">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full divide-y divide-neutral-100 text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Возраст</th>
              <th className="px-4 py-3 font-medium">Дата регистрации</th>
              <th className="px-4 py-3 font-medium">Последний вход</th>
              <th className="px-4 py-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50/60">
                <td className="px-4 py-3 font-medium text-neutral-900">{user.email}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {user.full_name || user.username || '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.is_admin
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {user.is_admin ? 'Админ' : 'Пользователь'}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{user.age || '—'}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {user.last_login ? formatDate(user.last_login) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      Редактировать
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user)}
                      isLoading={isDeletingId === user.id}
                    >
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsersTable

