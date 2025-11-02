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
}

export default routers