import { Navigate, Outlet } from 'react-router-dom'
import { getToken, getUserRole } from '../utils/api'
import routers from '../utils/routers'

/**
 * ProtectedRoute - Bảo vệ routes theo role
 * @param {string} requiredRole - Role cần thiết để truy cập ('admin' hoặc 'user')
 */
export default function ProtectedRoute({ requiredRole }) {
  const token = getToken()
  const userRole = getUserRole()

  // Chưa đăng nhập - redirect về trang login
  if (!token) {
    return <Navigate to={routers.Login} replace />
  }

  // Đã đăng nhập nhưng không đúng role
  if (requiredRole && userRole !== requiredRole) {
    // Admin cố vào route user -> redirect về admin
    if (userRole === 'admin') {
      return <Navigate to={routers.AdminInfo} replace />
    }
    // User cố vào route admin -> redirect về user
    if (userRole === 'user') {
      return <Navigate to={routers.Patient} replace />
    }
    // Fallback: redirect về login
    return <Navigate to={routers.Login} replace />
  }

  // Đủ quyền - render children
  return <Outlet />
}
