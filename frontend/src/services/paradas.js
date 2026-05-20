import api from './api'

export const getParadas    = ()        => api.get('/paradas')
export const createParada  = (data)    => api.post('/paradas', data)
export const updateParada  = (id, data)=> api.put(`/paradas/${id}`, data)
export const deleteParada  = (id)      => api.delete(`/paradas/${id}`)
