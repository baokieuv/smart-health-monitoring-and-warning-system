import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/homePage';
import PatientList from './pages/patients/PatientList';
import PatientDetail from './pages/patients/PatientDetail';
import RoomList from './pages/rooms/RoomList';
import RoomDetail from './pages/rooms/RoomDetail';
import Alerts from './pages/alerts/Alerts';
import Notes from './pages/notes/Notes';
import ProfilePage from './pages/profilePage/profilePage';
import Header from './layouts/header/header';
import Footer from './layouts/footer/footer';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import routers from './utils/routers';
import { getToken, getUserRole } from './utils/api';
import { SocketProvider } from './contexts/SocketContext';

// Admin pages
import LoginPage from './layouts/LoginPage';
import AdminShell from './pages/admin/adminShell/adminShell';
import AdminInfo from './pages/admin/info/AdminInfo';
import DoctorList from './pages/admin/doctors/DoctorList';
import DoctorForm from './pages/admin/doctors/DoctorForm';
import DoctorDetail from './pages/admin/doctors/DoctorDetail';
import AdminRoomList from './pages/admin/rooms/AdminRoomList';
import AdminRoomForm from './pages/admin/rooms/AdminRoomForm';
import DeviceList from './pages/admin/devices/DeviceList';

// Family access pages
import FamilyAccessPage from './pages/familyAccess/FamilyAccessPage';
import FamilyPatientDetail from './pages/familyAccess/FamilyPatientDetail';

// const Protected = () => {
//   const token = getToken()
//   return token ? <Outlet /> : <Navigate to={routers.Login} replace />
// }

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
    return <Navigate to={routers.Home} replace />
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
    <SocketProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}  
          <Route path={routers.Login} element={<LoginPage />} />
          <Route path={routers.AdminLogin} element={<Navigate to={routers.Login} replace />} />
          
          {/* Family Access Routes - Public, no authentication needed */}
          <Route path={routers.FamilyAccess} element={<FamilyAccessPage />} />
          <Route path={routers.FamilyPatientDetailPath} element={<FamilyPatientDetail />} />
          
          {/* Home Route - Redirect based on login status */}
          <Route path={routers.HomeRedirect} element={<HomeRedirect />} />
          <Route path={routers.Home} element={<HomePage />} />
          
          {/* Doctor Routes - Protected for 'doctor' role */}
          <Route element={<ProtectedRoute requiredRole="doctor" />}>
            <Route path={routers.Patient} element={<MainLayout><PatientList /></MainLayout>} />
            <Route path={routers.PatientDetail} element={<MainLayout><PatientDetail /></MainLayout>} />
            <Route path={routers.RoomList} element={<MainLayout><RoomList /></MainLayout>} />
            <Route path={routers.RoomDetail} element={<MainLayout><RoomDetail /></MainLayout>} />
            <Route path={routers.Alerts} element={<MainLayout><Alerts /></MainLayout>} />
            <Route path={routers.Notes} element={<MainLayout><Notes /></MainLayout>} />
            <Route path={routers.ProfilePagePath} element={<SimpleLayout><ProfilePage /></SimpleLayout>} />
          </Route>
          
          {/* Admin Routes - Protected for 'admin' role */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path={routers.ProfilePagePath} element={<SimpleLayout><ProfilePage /></SimpleLayout>} />
            <Route element={<AdminShell />}>
              <Route path={routers.AdminInfo} element={<AdminInfo />} />
              <Route path={routers.AdminDoctors} element={<DoctorList />} />
              <Route path={routers.AdminDoctorCreate} element={<DoctorForm />} />
              <Route path={routers.AdminDoctorDetailPath} element={<DoctorDetail />} />
              <Route path={routers.AdminRooms} element={<AdminRoomList />} />
              <Route path={routers.AdminRoomCreate} element={<AdminRoomForm />} />
              <Route path={routers.AdminRoomDetailPath} element={<AdminRoomForm />} />
              <Route path={routers.AdminDevices} element={<DeviceList />} />
            </Route>
          </Route>

          {/* 404 - Redirect to login if not authenticated */}
          <Route path="*" element={<Navigate to={routers.Login} replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
