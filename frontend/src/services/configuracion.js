import api from './api'

export const getConfiguracion  = (clave)         => api.get(`/configuracion/${clave}`)
export const setConfiguracion  = (clave, valor)  => api.put(`/configuracion/${clave}`, { valor })
