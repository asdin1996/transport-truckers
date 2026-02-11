import api from './api'

export const getViajes = () => api.get('/viajes')
export const getViaje = (id) => api.get(`/viajes/${id}`)
export const createViaje = (data) => api.post('/viajes', data)
export const updateViaje = (id, data) => api.put(`/viajes/${id}`, data)
export const cambiarEstado = (id, estado) => api.patch(`/viajes/${id}/estado`, { estado })
