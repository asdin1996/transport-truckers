import api from './api'

export const getGestores   = ()           => api.get('/gestores')
export const createGestor  = (data)       => api.post('/gestores', data)
export const updateGestor  = (id, data)   => api.put(`/gestores/${id}`, data)
export const deleteGestor  = (id)         => api.delete(`/gestores/${id}`)
