import api from './api'

export const getOrganizacionesContratantes  = ()           => api.get('/organizaciones-contratantes')
export const createOrganizacionContratante  = (data)       => api.post('/organizaciones-contratantes', data)
export const updateOrganizacionContratante  = (id, data)   => api.put(`/organizaciones-contratantes/${id}`, data)
export const deleteOrganizacionContratante  = (id)         => api.delete(`/organizaciones-contratantes/${id}`)
