import api from './api'

export const getGastos = (viajeId) => api.get('/gastos', { params: { viaje_id: viajeId } })
export const createGasto = (data) => api.post('/gastos', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deleteGasto = (id) => api.delete(`/gastos/${id}`)
