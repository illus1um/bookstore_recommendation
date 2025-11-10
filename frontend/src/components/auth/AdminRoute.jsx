import { Navigate, useLocation } from 'react-router-dom'
import Loading from '../common/Loading'
import { useAuth } from '../../hooks/useAuth'

const AdminRoute = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated, user, meQuery } = useAuth()

  if (meQuery.isLoading) {
    return <Loading message="Проверяем права доступа..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default AdminRoute

