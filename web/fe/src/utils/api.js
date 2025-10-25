import axios from 'axios'

const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || ''
const ACCESS_TOKEN_KEY = 'access_token'

export const getToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)
export const setToken = (token) => {
	if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token)
}
export const clearToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY)

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
	unwrap(api.post('/api/v1/login/', payload))

export const logout = () => unwrap(api.post('/api/v1/logout/'))

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

// Optional endpoints (backend may or may not provide them)
export const getDoctorSpecializations = () =>
	unwrap(
		api.get('/api/v1/admin/doctors/specializations').catch((e) => {
			// If not implemented, rethrow so UI can fallback
			throw e
		})
	)

export const exportDoctorReport = (params = {}) =>
	api.get('/api/v1/admin/doctors/report', { params, responseType: 'blob' })

export const getDoctorVitals = (doctorId) =>
	unwrap(api.get(`/api/v1/admin/doctors/${doctorId}/vitals`).catch((e) => { throw e }))

export default {
	api,
	getToken,
	setToken,
	clearToken,
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
}

