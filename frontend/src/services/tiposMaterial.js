import api from './api'

export const getTiposMaterial  = ()           => api.get('/tipos-material')
export const createTipoMaterial = (data)      => api.post('/tipos-material', data)
export const updateTipoMaterial = (id, data)  => api.put(`/tipos-material/${id}`, data)
export const deleteTipoMaterial = (id)        => api.delete(`/tipos-material/${id}`)
export const importTiposMaterial = (formData) => api.post('/tipos-material/import', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
