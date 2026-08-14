import api from './api'

export const getMotivosCancelacion  = ()           => api.get('/motivos-cancelacion')
export const createMotivoCancelacion = (data)      => api.post('/motivos-cancelacion', data)
export const updateMotivoCancelacion = (id, data)  => api.put(`/motivos-cancelacion/${id}`, data)
export const deleteMotivoCancelacion = (id)        => api.delete(`/motivos-cancelacion/${id}`)
