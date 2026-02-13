import api from './api'

export const getCamioneros = () => api.get('/camioneros')
export const getCamionero = (id) => api.get(`/camioneros/${id}`)
export const createCamionero = (data) => api.post('/camioneros', data)
export const updateCamionero = (id, data) => api.put(`/camioneros/${id}`, data)
export const deleteCamionero = (id) => api.delete(`/camioneros/${id}`)
