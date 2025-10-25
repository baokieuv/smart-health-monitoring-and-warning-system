const routers = {
	AdminLogin: '/admin/login',
	AdminDoctors: '/admin/doctors',
	AdminDoctorCreate: '/admin/doctors/create',
	AdminDoctorDetailPath: '/admin/doctors/:id',
	AdminDoctorDetail: (id = ':id') => `/admin/doctors/${id}`,
}

export default routers