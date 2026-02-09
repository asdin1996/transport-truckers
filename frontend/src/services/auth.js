import api from './api'

export const login = (email, password) =>
  api.post('/login', { email, password })

export const logout = () =>
  api.post('/logout')

export const me = () =>
  api.get('/me')
