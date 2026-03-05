import api from './api'

export const getRutas     = ()           => api.get('/rutas')
export const createRuta   = (data)       => api.post('/rutas', data)
export const updateRuta   = (id, data)   => api.put(`/rutas/${id}`, data)
export const deleteRuta   = (id)         => api.delete(`/rutas/${id}`)
