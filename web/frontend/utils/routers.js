const routers = {
  // Public routes
  Home: '/',
  PatientMonitor: '/patients',
  PatientDetail: (id = ':id') => `/patients/${id}`,
  RoomList: '/rooms',
  RoomDetail: (code = ':code') => `/rooms/${code}`,
  Alerts: '/alerts',
  Notes: '/notes',
  ProfilePage: (cccd = ':cccd') => `/profile/${cccd}`,
  
  // Admin routes
  AdminLogin: '/admin/login',
  AdminDoctors: '/admin/doctors',
  AdminDoctorCreate: '/admin/doctors/create',
  AdminDoctorDetailPath: '/admin/doctors/:id',
  AdminDoctorDetail: (id = ':id') => `/admin/doctors/${id}`,
}

export default routers