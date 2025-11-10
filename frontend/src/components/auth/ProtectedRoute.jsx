import { Navigate, useLocation } from 'react-router-dom'
import Loading from '../common/Loading'
import { useAuth } from '../../hooks/useAuth'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated, meQuery } = useAuth()

  if (meQuery.isLoading) {
    return <Loading message="Проверяем авторизацию..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute

