import api from './api'

export const getUltimaPorCamionero = (camioneroId) =>
  api.get(`/ubicaciones/camionero/${camioneroId}`)

export const getUltimaPorViaje = (viajeId) =>
  api.get(`/ubicaciones/viaje/${viajeId}`)
