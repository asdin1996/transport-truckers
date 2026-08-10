import api from './api'

export const getAlmacenes   = ()           => api.get('/almacenes')
export const createAlmacen  = (data)       => api.post('/almacenes', data)
export const updateAlmacen  = (id, data)   => api.put(`/almacenes/${id}`, data)
export const deleteAlmacen  = (id)         => api.delete(`/almacenes/${id}`)
