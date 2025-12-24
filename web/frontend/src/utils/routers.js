const routers = {
  // Public routes
  Login: '/login',
  HomeRedirect: '/',
  Home: '/home',
  Patient: '/patients',
  PatientDetail: '/patients/:id',
  PatientCreate: '/patients/create',
  RoomList: '/rooms',
  RoomDetail: '/rooms/:code',
  Alerts: '/alerts',
  Notes: '/notes',
  ProfilePagePath: '/profile/:userId',
  ProfilePage: (userId = ':userId') => `/profile/${userId}`,
  
  // Family access routes (không cần đăng nhập)
  FamilyAccess: '/family-access',
  FamilyPatientDetailPath: '/family-patient/:id',
  FamilyPatientDetail: (id = ':id') => `/family-patient/${id}`,
  
  // Admin routes
  AdminLogin: '/admin/login',
  AdminInfo: '/admin',
  AdminDoctors: '/admin/doctors',
  AdminDoctorCreate: '/admin/doctors/create',
  AdminDoctorDetailPath: '/admin/doctors/:id',
  AdminDoctorDetail: (id = ':id') => `/admin/doctors/${id}`,
  AdminRooms: '/admin/rooms',
  AdminRoomCreate: '/admin/rooms/create',
  AdminRoomDetailPath: '/admin/rooms/:code',
  AdminRoomDetail: (code = ':code') => `/admin/rooms/${code}`,
  AdminDevices: '/admin/devices',
}

export default routers