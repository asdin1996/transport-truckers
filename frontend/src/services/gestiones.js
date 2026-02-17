import api from './api'

export const getGestiones = (viajeId) => api.get(`/viajes/${viajeId}/gestiones`)
export const createGestion = (viajeId, data) => api.post(`/viajes/${viajeId}/gestiones`, data)
export const updateGestion = (viajeId, id, data) => api.patch(`/viajes/${viajeId}/gestiones/${id}`, data)
export const deleteGestion = (viajeId, id) => api.delete(`/viajes/${viajeId}/gestiones/${id}`)
