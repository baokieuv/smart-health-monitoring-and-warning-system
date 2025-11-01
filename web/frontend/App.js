import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';
import HomePage from './pages/homePage';
import PatientList from './pages/patients/PatientList';
import PatientDetail from './pages/patients/PatientDetail';
import RoomList from './pages/rooms/RoomList';
import RoomDetail from './pages/rooms/RoomDetail';
import ProfilePage from './pages/profilePage/profilePafe';
import Header from './layouts/header/header';
import Footer from './layouts/footer/footer';
import Sidebar from './frontend/components/Sidebar';
import routers from './utils/routers';
import { getToken } from './utils/api';

// Admin pages
import LoginPage from './pages/admin/LoginPage';
import AdminShell from './pages/admin/adminShell/adminShell';
import DoctorList from './pages/admin/doctors/DoctorList';
import DoctorForm from './pages/admin/doctors/DoctorForm';

const Protected = () => {
  const token = getToken()
  return token ? <Outlet /> : <Navigate to={routers.AdminLogin} replace />
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
        {/* Home Route */}
        <Route path={routers.Home} element={<SimpleLayout><HomePage /></SimpleLayout>} />
        
        {/* Patient Routes with Sidebar */}
        <Route path="/patients" element={<MainLayout><PatientList /></MainLayout>} />
        <Route path="/patients/:id" element={<MainLayout><PatientDetail /></MainLayout>} />
        
        {/* Room Routes with Sidebar */}
        <Route path="/rooms" element={<MainLayout><RoomList /></MainLayout>} />
        <Route path="/rooms/:code" element={<MainLayout><RoomDetail /></MainLayout>} />
        
        {/* Other Routes */}
        <Route path={routers.Alerts} element={
          <MainLayout>
            <div style={{padding: 40, textAlign: 'center'}}>
              <h2>🚨 Cảnh báo</h2>
              <p>Đang phát triển...</p>
            </div>
          </MainLayout>
        } />
        <Route path={routers.Notes} element={
          <MainLayout>
            <div style={{padding: 40, textAlign: 'center'}}>
              <h2>📝 Ghi chú</h2>
              <p>Đang phát triển...</p>
            </div>
          </MainLayout>
        } />
        <Route path="/profile" element={<SimpleLayout><ProfilePage /></SimpleLayout>} />
        
        {/* Admin Routes */}
        <Route path={routers.AdminLogin} element={<LoginPage />} />
        
        <Route element={<Protected />}>
          <Route element={<AdminShell />}>
            <Route path={routers.AdminDoctors} element={<DoctorList />} />
            <Route path={routers.AdminDoctorCreate} element={<DoctorForm />} />
            <Route path={routers.AdminDoctorDetailPath} element={<DoctorForm />} />
          </Route>
        </Route>

        <Route path="*" element={<SimpleLayout><div>404 - Page Not Found</div></SimpleLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
