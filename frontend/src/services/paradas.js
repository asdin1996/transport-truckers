import api from './api'

export const getParadas   = ()       => api.get('/paradas')
export const createParada = (data)   => api.post('/paradas', data)
export const importParadas = (paradas) => api.post('/paradas/import', { paradas })
export const deleteParada = (id)     => api.delete(`/paradas/${id}`)
