import api from './api'

export const getViajes            = ()                => api.get('/viajes')
export const getViajesSinConductor = ()               => api.get('/viajes/sin-conductor')
export const getViaje             = (id)              => api.get(`/viajes/${id}`)
export const createViaje          = (data)            => api.post('/viajes', data)
export const updateViaje          = (id, data)        => api.put(`/viajes/${id}`, data)
export const cambiarEstado        = (id, estado)      => api.patch(`/viajes/${id}/estado`, { estado })
export const cancelarViaje        = (id, motivo_cancelacion_id) => api.patch(`/viajes/${id}/cancelar`, { motivo_cancelacion_id })
export const asignarCamionero     = (id, data)        => api.patch(`/viajes/${id}/asignar-camionero`, data)
export const cambiarOrden         = (id, orden)       => api.put(`/viajes/${id}`, { orden })
export const updateParadas        = (id, paradas_completadas) => api.patch(`/viajes/${id}/paradas`, { paradas_completadas })
export const deleteViaje          = (id)              => api.delete(`/viajes/${id}`)
