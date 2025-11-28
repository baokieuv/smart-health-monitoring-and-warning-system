import { Navigate, Outlet } from 'react-router-dom'
import { getToken, getUserRole } from '../utils/api'
import routers from '../utils/routers'

/**
 * ProtectedRoute - Bảo vệ routes theo role
 * @param {string} requiredRole - Role cần thiết để truy cập ('admin' hoặc 'doctor')
 */
export default function ProtectedRoute({ requiredRole }) {
  const token = getToken()
  const userRole = getUserRole()

  // Chưa đăng nhập - redirect về trang login
  if (!token) {
    return <Navigate to={routers.Login} replace />
  }

  // Kiểm tra role
  if (requiredRole && userRole !== requiredRole) {
    // Admin cố vào route doctor -> redirect về admin
    if (userRole === 'admin') {
      return <Navigate to={routers.AdminInfo} replace />
    }
    // Doctor cố vào route admin -> redirect về doctor home
    if (userRole === 'doctor') {
      return <Navigate to={routers.Home} replace />
    }
    // Fallback: redirect về login
    return <Navigate to={routers.Login} replace />
  }

  // Đủ quyền - render children
  return <Outlet />
}
