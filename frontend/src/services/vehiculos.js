import api from './api'

export const getVehiculos = () => api.get('/vehiculos')
export const getVehiculo = (id) => api.get(`/vehiculos/${id}`)
export const createVehiculo = (data) => api.post('/vehiculos', data)
export const updateVehiculo = (id, data) => api.put(`/vehiculos/${id}`, data)
export const deleteVehiculo = (id) => api.delete(`/vehiculos/${id}`)
