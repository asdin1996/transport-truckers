import api from './api'

export const getMensajesConversacion = (userId) => api.get(`/mensajes/conversacion/${userId}`)
export const sendMensaje = (data) => api.post('/mensajes', data)
export const getMensajesNoLeidos = () => api.get('/mensajes/no-leidos')
export const marcarLeidos = (userId) => api.patch(`/mensajes/leidos/${userId}`)
