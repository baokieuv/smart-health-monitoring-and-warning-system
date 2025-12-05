import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'

export const getToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
export const setToken = (token) => {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token)
}
export const clearToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)
export const setRefreshToken = (token) => {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const getUserInfo = () => {
  const userInfo = localStorage.getItem(USER_INFO_KEY)
  return userInfo ? JSON.parse(userInfo) : null
}
export const setUserInfo = (userInfo) => {
  if (userInfo) localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}
export const clearUserInfo = () => localStorage.removeItem(USER_INFO_KEY)

export const getUserRole = () => {
  const userInfo = getUserInfo()
  return userInfo?.role || null
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Attach token
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Basic response/error normalization
const unwrap = (p) => p.then((r) => r.data)

// Enhance error for 429 to surface retryAfter
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status
    if (status === 429) {
      const retryAfter = Number(err?.response?.headers?.['retry-after']) || undefined
      err.rateLimit = { retryAfter }
    }
    return Promise.reject(err)
  }
)

// Auth
export const login = (payload) =>
  unwrap(api.post('/api/v1/auth/login', payload))

export const logout = () => {
  const refreshToken = getRefreshToken()
  return unwrap(api.post('/api/v1/auth/logout', { refresh_token: refreshToken }))
}

export const refreshAccessToken = () => {
  const refreshToken = getRefreshToken()
  return unwrap(api.post('/api/v1/auth/refresh', { refresh_token: refreshToken }))
}

// Admin - Doctors
export const createDoctor = (payload) =>
  unwrap(api.post('/api/v1/admin/doctors/', payload))

export const getDoctorList = ({ page = 1, limit = 10, search = '', specialization = '' } = {}) =>
  unwrap(
    api.get('/api/v1/admin/doctors/', {
      params: { page, limit, search: search || undefined, specialization: specialization || undefined },
    })
  )

export const getDoctorDetail = (doctorId) => unwrap(api.get(`/api/v1/admin/doctors/${doctorId}`))

export const updateDoctor = (doctorId, payload) => unwrap(api.put(`/api/v1/admin/doctors/${doctorId}`, payload))

export const deleteDoctor = (doctorId) => unwrap(api.delete(`/api/v1/admin/doctors/${doctorId}`))

// Doctor - Patients
export const getDoctorsList = () =>
  unwrap(api.get('/api/v1/doctor/doctors-list'))

export const createPatient = (payload) =>
  unwrap(api.post('/api/v1/doctor/patients', payload))

export const getPatientList = ({ page = 1, limit = 10, search = '' } = {}) =>
  unwrap(
    api.get('/api/v1/doctor/patients', {
      params: { page, limit, search: search || undefined },
    })
  )

export const getPatientDetail = (patientId) => unwrap(api.get(`/api/v1/doctor/patients/${patientId}`))

export const updatePatient = (patientId, payload) => unwrap(api.put(`/api/v1/doctor/patients/${patientId}`, payload))

export const deletePatient = (patientId) => unwrap(api.delete(`/api/v1/doctor/patients/${patientId}`))

// Optional endpoints
export const getDoctorSpecializations = () =>
  unwrap(
    api.get('/api/v1/admin/doctors/specializations').catch((e) => {
      throw e
    })
  )

export const exportDoctorReport = (params = {}) =>
  api.get('/api/v1/admin/doctors/report', { params, responseType: 'blob' })

export const getDoctorVitals = (doctorId) =>
  unwrap(api.get(`/api/v1/admin/doctors/${doctorId}/vitals`).catch((e) => { throw e }))

// Update doctor credentials
export const updateDoctorUsername = (doctorId, username) =>
  unwrap(api.put(`/api/v1/admin/doctors/${doctorId}/username`, { username }))

export const updateDoctorPassword = (doctorId, password) =>
  unwrap(api.put(`/api/v1/admin/doctors/${doctorId}/password`, { password }))

// Doctor Profile APIs
export const getDoctorProfile = (userId) => unwrap(api.get(`/api/v1/admin/user/${userId}`))

export const updateDoctorProfile = (userId, payload) => unwrap(api.put(`/api/v1/admin/user/${userId}/profile`, payload))

export default {
  api,
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo,
  clearUserInfo,
  getUserRole,
  login,
  logout,
  createDoctor,
  getDoctorList,
  getDoctorDetail,
  updateDoctor,
  deleteDoctor,
  getDoctorSpecializations,
  exportDoctorReport,
  getDoctorVitals,
  updateDoctorUsername,
  updateDoctorPassword,
  getDoctorProfile,
  updateDoctorProfile,
  createPatient,
  getPatientList,
  getPatientDetail,
  updatePatient,
  deletePatient,
}
