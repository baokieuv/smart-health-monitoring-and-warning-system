import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';
import HomePage from './frontend/pages/homePage';
import PatientList from './frontend/pages/patients/PatientList';
import PatientDetail from './frontend/pages/patients/PatientDetail';
import RoomList from './frontend/pages/rooms/RoomList';
import RoomDetail from './frontend/pages/rooms/RoomDetail';
import Alerts from './frontend/pages/alerts/Alerts';
import Notes from './frontend/pages/notes/Notes';
import ProfilePage from './frontend/pages/profilePage/profilePage';
import Header from './frontend/layouts/header/header';
import Footer from './frontend/layouts/footer/footer';
import Sidebar from './frontend/components/Sidebar';
import ProtectedRoute from './frontend/components/ProtectedRoute';
import routers from './frontend/utils/routers';
import { getToken, getUserRole } from './frontend/utils/api';

// Admin pages
import LoginPage from './frontend/pages/admin/adminShell/LoginPage';
import AdminShell from './frontend/pages/admin/adminShell/adminShell';
import AdminInfo from './frontend/pages/admin/info/AdminInfo';
import DoctorList from './frontend/pages/admin/doctors/DoctorList';
import DoctorForm from './frontend/pages/admin/doctors/DoctorForm';
import DoctorDetail from './frontend/pages/admin/doctors/DoctorDetail';
import AdminRoomList from './frontend/pages/admin/rooms/AdminRoomList';
import AdminRoomForm from './frontend/pages/admin/rooms/AdminRoomForm';

const Protected = () => {
  const token = getToken()
  return token ? <Outlet /> : <Navigate to={routers.Login} replace />
}

// Redirect to appropriate page based on login status and role
const HomeRedirect = () => {
  const token = getToken()
  const userRole = getUserRole()
  
  if (!token) {
    // Chưa đăng nhập -> redirect về login
    return <Navigate to={routers.Login} replace />
  }
  
  // Đã đăng nhập -> redirect theo role
  if (userRole === 'admin') {
    return <Navigate to={routers.AdminInfo} replace />
  } else {
    return <Navigate to={routers.Patient} replace />
  }
}

// Layout with Sidebar for patient/room pages
const MainLayout = ({ children }) => (
  <div className="App">
    <Header />
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
    <Footer />
  </div>
)

// Layout without Sidebar
const SimpleLayout = ({ children }) => (
  <div className="App">
    <Header />
    <main className="main-content">{children}</main>
    <Footer />
  </div>
)

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path={routers.Login} element={<LoginPage />} />
        <Route path={routers.AdminLogin} element={<Navigate to={routers.Login} replace />} />
        
        {/* Home Route - Redirect based on login status */}
        <Route path={routers.Home} element={<HomeRedirect />} />
        
        {/* User Routes - Protected for 'user' role */}
        <Route element={<ProtectedRoute requiredRole="user" />}>
          <Route path={routers.Patient} element={<MainLayout><PatientList /></MainLayout>} />
          <Route path={routers.PatientDetail} element={<MainLayout><PatientDetail /></MainLayout>} />
          <Route path={routers.RoomList} element={<MainLayout><RoomList /></MainLayout>} />
          <Route path={routers.RoomDetail} element={<MainLayout><RoomDetail /></MainLayout>} />
          <Route path={routers.Alerts} element={<MainLayout><Alerts /></MainLayout>} />
          <Route path={routers.Notes} element={<MainLayout><Notes /></MainLayout>} />
          <Route path={routers.ProfilePage} element={<SimpleLayout><ProfilePage /></SimpleLayout>} />
        </Route>
        
        {/* Admin Routes - Protected for 'admin' role */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminShell />}>
            <Route path={routers.AdminInfo} element={<AdminInfo />} />
            <Route path={routers.AdminDoctors} element={<DoctorList />} />
            <Route path={routers.AdminDoctorCreate} element={<DoctorForm />} />
            <Route path={routers.AdminDoctorDetailPath} element={<DoctorDetail />} />
            <Route path={routers.AdminRooms} element={<AdminRoomList />} />
            <Route path={routers.AdminRoomCreate} element={<AdminRoomForm />} />
            <Route path={routers.AdminRoomDetailPath} element={<AdminRoomForm />} />
          </Route>
        </Route>

        {/* 404 - Redirect to login if not authenticated */}
        <Route path="*" element={<Navigate to={routers.Login} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
